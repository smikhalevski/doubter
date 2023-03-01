import { AnyShape, DeepPartialProtocol, DeepPartialShape, Result, Shape, ValueType } from './Shape';
import {
  callApply,
  concatIssues,
  copyUnsafeChecks,
  createIssueFactory,
  getValueType,
  isArray,
  isAsyncShape,
  isEqual,
  NEVER,
  ok,
  toDeepPartialShape,
} from '../utils';
import { ConstraintOptions, Issue, Message, ParseOptions } from '../shared-types';
import {
  CODE_INTERSECTION,
  MESSAGE_INTERSECTION,
  TYPE_ANY,
  TYPE_ARRAY,
  TYPE_DATE,
  TYPE_NEVER,
  TYPE_OBJECT,
} from '../constants';

// prettier-ignore
export type ToIntersection<U extends AnyShape> =
  (U extends any ? (k: U) => void : never) extends (k: infer I) => void ? I extends AnyShape ? I : never : never;

export type DeepPartialIntersectionShape<U extends readonly AnyShape[]> = IntersectionShape<{
  [K in keyof U]: U[K] extends AnyShape ? DeepPartialShape<U[K]> : never;
}>;

export class IntersectionShape<U extends readonly AnyShape[]>
  extends Shape<ToIntersection<U[number]>['input'], ToIntersection<U[number]>['output']>
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

  protected _isAsync(): boolean {
    return this.shapes.some(isAsyncShape);
  }

  protected _getInputTypes(): readonly ValueType[] {
    return intersectValueTypes(this.shapes.map(shape => shape.inputTypes));
  }

  protected _apply(input: any, options: ParseOptions): Result<ToIntersection<U[number]>['output']> {
    const { shapes } = this;
    const shapesLength = shapes.length;

    let outputs = null;
    let issues = null;

    for (let i = 0; i < shapesLength; ++i) {
      const result = shapes[i]['_apply'](input, options);

      if (result === null) {
        continue;
      }
      if (isArray(result)) {
        if (!options.verbose) {
          return result;
        }
        issues = concatIssues(issues, result);
        continue;
      }

      const output = result.value;

      if (outputs === null) {
        outputs = [output];
        continue;
      }
      if (!outputs.includes(output)) {
        outputs.push(output);
      }
    }

    if (issues === null) {
      return this._applyIntersection(input, outputs, options);
    }
    return issues;
  }

  protected _applyAsync(input: any, options: ParseOptions): Promise<Result<ToIntersection<U[number]>['output']>> {
    return new Promise(resolve => {
      const { shapes } = this;
      const shapesLength = shapes.length;

      let outputs: unknown[] | null = null;
      let issues: Issue[] | null = null;
      let index = -1;

      const handleResult = (result: Result) => {
        if (result !== null) {
          if (isArray(result)) {
            if (!options.verbose) {
              return result;
            }
            issues = concatIssues(issues, result);
          } else {
            const output = result.value;

            if (outputs === null) {
              outputs = [output];
            } else if (!outputs.includes(output)) {
              outputs.push(output);
            }
          }
        }
        return next();
      };

      const next = (): Result | Promise<Result> => {
        index++;

        if (index !== shapesLength) {
          return callApply(shapes[index], input, options, handleResult);
        }
        if (issues === null) {
          return this._applyIntersection(input, outputs, options);
        }
        return issues;
      };

      resolve(next());
    });
  }

  /**
   * Finalizes the intersection by intersecting values and application of checks.
   */
  private _applyIntersection(
    input: any,
    outputs: any[] | null,
    options: ParseOptions
  ): Result<ToIntersection<U[number]>['output']> {
    const { shapes, _applyChecks } = this;

    let result = null;
    let output = input;
    let issues;

    if (outputs !== null) {
      let outputsLength = outputs.length;

      if (outputsLength !== shapes.length) {
        outputsLength = outputs.push(input);
      }

      output = outputs[0];

      for (let i = 1; i < outputsLength && output !== NEVER; ++i) {
        output = intersectValues(output, outputs[i]);
      }
      if (output === NEVER) {
        return this._typeIssueFactory(input, options);
      }
      if (!isEqual(output, input)) {
        result = ok(output);
      }
    }

    if (_applyChecks === null || (issues = _applyChecks(output, null, options)) === null) {
      return result;
    }
    return issues;
  }
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

/**
 * Returns the intersection type.
 *
 * @param typesByShape The array of arrays of unique input types associated with each shape in the intersection.
 */
export function intersectValueTypes(typesByShape: Array<readonly ValueType[]>): ValueType[] {
  const shapesLength = typesByShape.length;

  if (shapesLength === 0) {
    return [TYPE_NEVER];
  }

  const types = typesByShape[0].slice(0);

  for (let i = 1; i < typesByShape.length; ++i) {
    const shapeTypes = typesByShape[i];

    if (shapeTypes[0] === TYPE_NEVER) {
      return [TYPE_NEVER];
    }
    if (shapeTypes[0] === TYPE_ANY) {
      return [TYPE_ANY];
    }

    for (let j = 0; j < types.length; ++j) {
      if (!shapeTypes.includes(types[j])) {
        types.splice(j--, 1);
      }
    }
  }

  if (types.length === 0) {
    return [TYPE_NEVER];
  }
  return types;
}
