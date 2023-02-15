import { AnyShape, ApplyResult, DeepPartialProtocol, DeepPartialShape, Shape, ValueType } from './Shape';
import {
  copyUnsafeChecks,
  createIssueFactory,
  getValueType,
  isArray,
  isAsyncShapes,
  isEqual,
  ok,
  ToArray,
  toDeepPartialShape,
} from '../utils';
import { ConstraintOptions, Issue, Message, ParseOptions } from '../shared-types';
import { CODE_INTERSECTION, MESSAGE_INTERSECTION, TYPE_ARRAY, TYPE_DATE, TYPE_NEVER, TYPE_OBJECT } from '../constants';

export type ToIntersection<U> = (U extends any ? (k: U) => void : never) extends (k: infer I) => void ? I : never;

export type DeepPartialIntersectionShape<U extends readonly AnyShape[]> = IntersectionShape<
  ToArray<{ [K in keyof U]: U[K] extends AnyShape ? DeepPartialShape<U[K]> : never }>
>;

export class IntersectionShape<U extends readonly AnyShape[]>
  extends Shape<ToIntersection<U[number]['input']>, ToIntersection<U[number]['output']>>
  implements DeepPartialProtocol<DeepPartialIntersectionShape<U>>
{
  protected _options;
  protected _typeIssueFactory;

  constructor(readonly shapes: U, options?: ConstraintOptions | Message) {
    super();

    this._options = options;
    this._typeIssueFactory = createIssueFactory(CODE_INTERSECTION, MESSAGE_INTERSECTION, options, undefined);
  }

  at(key: unknown): AnyShape | null {
    const { shapes } = this;

    if (shapes.length === 0) {
      return null;
    }
    if (shapes.length === 1) {
      return shapes[0].at(key);
    }

    const valueShapes = [];

    for (const shape of shapes) {
      const valueShape = shape.at(key);

      if (valueShape === null) {
        return null;
      }
      valueShapes.push(valueShape);
    }
    return new IntersectionShape(valueShapes);
  }

  deepPartial(): DeepPartialIntersectionShape<U> {
    return copyUnsafeChecks(this, new IntersectionShape<any>(this.shapes.map(toDeepPartialShape), this._options));
  }

  protected _requiresAsync(): boolean {
    return isAsyncShapes(this.shapes);
  }

  protected _getInputTypes(): readonly ValueType[] {
    return intersectValueTypes(this.shapes.map(shape => shape.inputTypes));
  }

  protected _apply(input: unknown, options: ParseOptions): ApplyResult<ToIntersection<U[number]['output']>> {
    const { shapes } = this;
    const shapesLength = shapes.length;

    let outputs: any[] | null = null;

    for (let i = 0; i < shapesLength; ++i) {
      const result = shapes[i]['_apply'](input, options);

      if (result === null) {
        continue;
      }
      if (isArray(result)) {
        return result;
      }
      const output = result.value;

      if (outputs === null) {
        outputs = [output];
        continue;
      }
      if (outputs.includes(output)) {
        continue;
      }
      outputs.push(output);
    }

    if (outputs === null) {
      return null;
    }
    if (outputs.length !== shapesLength) {
      outputs.push(input);
    }
    return intersectOutputs(input, outputs, this._typeIssueFactory, options);
  }

  protected _applyAsync(
    input: unknown,
    options: ParseOptions
  ): Promise<ApplyResult<ToIntersection<U[number]['output']>>> {
    const { shapes } = this;
    const shapesLength = shapes.length;

    const promises: Promise<ApplyResult>[] = [];

    for (let i = 0; i < shapesLength; ++i) {
      promises.push(shapes[i]['_applyAsync'](input, options));
    }

    return Promise.all(promises).then(results => {
      let outputs: any[] | null = null;

      for (let i = 0; i < shapesLength; ++i) {
        const result = results[i];

        if (result === null) {
          continue;
        }
        if (isArray(result)) {
          return result;
        }
        const output = result.value;

        if (outputs === null) {
          outputs = [output];
          continue;
        }
        if (outputs.includes(output)) {
          continue;
        }
        outputs.push(output);
      }

      if (outputs === null) {
        return null;
      }
      if (outputs.length !== shapesLength) {
        outputs.push(input);
      }
      return intersectOutputs(input, outputs, this._typeIssueFactory, options);
    });
  }
}

export const NEVER = Symbol();

export function intersectOutputs(
  input: unknown,
  outputs: any[],
  issueFactory: (input: unknown, options: Readonly<ParseOptions>) => Issue[],
  options: ParseOptions
): ApplyResult {
  const outputsLength = outputs.length;

  let value = outputs[0];

  for (let i = 1; i < outputsLength; ++i) {
    value = intersectValues(value, outputs[i]);

    if (value === NEVER) {
      return issueFactory(input, options);
    }
  }

  return ok(value);
}

export function intersectValues(a: any, b: any): any {
  if (isEqual(a, b)) {
    return a;
  }

  const aType = getValueType(a);
  const bType = getValueType(b);

  if (aType !== bType) {
    return NEVER;
  }

  if (aType === TYPE_DATE) {
    if (a.getTime() === b.getTime()) {
      return a;
    }
    return NEVER;
  }

  if (aType === TYPE_OBJECT) {
    const output = Object.assign({}, a, b);

    for (const key in a) {
      if (key in b) {
        const outputValue = intersectValues(a[key], b[key]);

        if (outputValue === NEVER) {
          return NEVER;
        }
        output[key] = outputValue;
      }
    }
    return output;
  }

  if (aType === TYPE_ARRAY) {
    const aLength = a.length;

    if (aLength !== b.length) {
      return NEVER;
    }

    let output = a;

    for (let i = 0; i < aLength; ++i) {
      const aValue = a[i];
      const bValue = b[i];

      if (isEqual(aValue, bValue)) {
        continue;
      }
      if (output === a) {
        output = a.slice(0);
      }
      const outputValue = intersectValues(aValue, bValue);

      if (outputValue === NEVER) {
        return NEVER;
      }
      output[i] = outputValue;
    }

    return output;
  }

  return NEVER;
}

export function intersectValueTypes(arr: Array<readonly ValueType[]>): ValueType[] {
  const arrLength = arr.length;

  if (arrLength === 0) {
    return [TYPE_NEVER];
  }

  const types = arr[0].slice(0);

  for (let i = 1; i < arr.length; ++i) {
    for (let j = 0; j < types.length; ++j) {
      if (arr[i].includes(types[j])) {
        continue;
      }
      types.splice(j--, 1);
    }
  }
  if (types.length === 0) {
    return [TYPE_NEVER];
  }
  return types;
}
