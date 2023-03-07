import {
  CODE_INTERSECTION,
  MESSAGE_INTERSECTION,
  TYPE_ANY,
  TYPE_ARRAY,
  TYPE_DATE,
  TYPE_MAP,
  TYPE_NEVER,
  TYPE_OBJECT,
  TYPE_PROMISE,
  TYPE_SET,
} from '../constants';
import { ApplyOptions, ConstraintOptions, Issue, Message } from '../types';
import {
  applyShape,
  concatIssues,
  copyUnsafeChecks,
  createIssueFactory,
  getShapeInputTypes,
  getShapeInputValues,
  getValueType,
  isArray,
  isAsyncShape,
  isEqual,
  ok,
  setObjectProperty,
  toDeepPartialShape,
} from '../utils';
import { AnyShape, DeepPartialProtocol, DeepPartialShape, NEVER, Result, Shape, Type } from './Shape';

// prettier-ignore
export type ToIntersection<U extends AnyShape> =
  (U extends any ? (k: U) => void : never) extends (k: infer I) => void ? I extends AnyShape ? I : never : never;

export type DeepPartialIntersectionShape<U extends readonly AnyShape[]> = IntersectionShape<{
  [K in keyof U]: U[K] extends AnyShape ? DeepPartialShape<U[K]> : never;
}>;

/**
 * The shape that requires an input to conform all given shapes.
 *
 * @template U The array of shapes that comprise an intersection.
 */
export class IntersectionShape<U extends readonly AnyShape[]>
  extends Shape<ToIntersection<U[number]>['input'], ToIntersection<U[number]>['output']>
  implements DeepPartialProtocol<DeepPartialIntersectionShape<U>>
{
  protected _options;
  protected _typeIssueFactory;

  /**
   * Creates a new {@linkcode IntersectionShape} instance.
   *
   * @param shapes The array of shapes that comprise an intersection.
   * @param options The union constraint options or an issue message.
   * @template U The array of shapes that comprise an intersection.
   */
  constructor(
    /**
     * The array of shapes that comprise an intersection.
     */
    readonly shapes: U,
    options?: ConstraintOptions | Message
  ) {
    super();

    this._options = options;
    this._typeIssueFactory = createIssueFactory(CODE_INTERSECTION, MESSAGE_INTERSECTION, options, undefined);
  }

  at(key: unknown): AnyShape | null {
    const shapes = [];

    for (const shape of this.shapes) {
      const valueShape = shape.at(key);

      if (valueShape !== null) {
        shapes.push(valueShape);
      }
    }
    if (shapes.length === 0) {
      return null;
    }
    if (shapes.length === 1) {
      return shapes[0];
    }
    return new IntersectionShape(shapes);
  }

  deepPartial(): DeepPartialIntersectionShape<U> {
    return copyUnsafeChecks(this, new IntersectionShape<any>(this.shapes.map(toDeepPartialShape), this._options));
  }

  protected _isAsync(): boolean {
    return this.shapes.some(isAsyncShape);
  }

  protected _getInputTypes(): readonly Type[] {
    return intersectTypes(this.shapes.map(getShapeInputTypes));
  }

  protected _getInputValues(): readonly unknown[] | null {
    return intersectValues(this.shapes.map(getShapeInputValues));
  }

  protected _apply(input: any, options: ApplyOptions): Result<ToIntersection<U[number]>['output']> {
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

  protected _applyAsync(input: any, options: ApplyOptions): Promise<Result<ToIntersection<U[number]>['output']>> {
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
          return applyShape(shapes[index], input, options, handleResult);
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
   * Merge values and apply checks.
   */
  private _applyIntersection(
    input: any,
    outputs: any[] | null,
    options: ApplyOptions
  ): Result<ToIntersection<U[number]>['output']> {
    const { shapes, _applyChecks } = this;

    let output = input;
    let issues = null;

    if (outputs !== null) {
      let outputsLength = outputs.length;

      if (outputsLength !== shapes.length) {
        outputsLength = outputs.push(input);
      }

      output = outputs[0];

      for (let i = 1; i < outputsLength && output !== NEVER; ++i) {
        output = mergeValues(output, outputs[i]);
      }
      if (output === NEVER) {
        return this._typeIssueFactory(input, options);
      }
    }

    if (
      (_applyChecks === null || (issues = _applyChecks(output, null, options)) === null) &&
      outputs !== null &&
      !isEqual(output, input)
    ) {
      return ok(output);
    }
    return issues;
  }
}

/**
 * Returns the intersection type.
 *
 * @param typesByShape The array of arrays of unique input types associated with each shape in the intersection.
 */
export function intersectTypes(typesByShape: Array<readonly Type[]>): Type[] {
  if (typesByShape.length === 0) {
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
      if (shapeTypes.indexOf(types[j]) === -1) {
        types.splice(j--, 1);
      }
    }
  }

  if (types.length === 0) {
    return [TYPE_NEVER];
  }
  return types;
}

/**
 * Returns the array of discrete values accepted by all shapes, or returns `null` if some shapes accept continuous
 * ranges of values.
 *
 * @param valuesByShape The array of arrays of discrete values accepted by shapes.
 */
export function intersectValues(valuesByShape: Array<readonly unknown[] | null>): unknown[] | null {
  let values: unknown[] | null = null;

  for (const shapeValues of valuesByShape) {
    if (shapeValues === null) {
      continue;
    }
    if (values === null) {
      values = shapeValues.slice(0);
      continue;
    }
    for (let i = 0; i < values.length; ++i) {
      if (!shapeValues.includes(values[i])) {
        values.splice(i--, 1);
      }
    }
    if (values.length === 0) {
      return values;
    }
  }

  return values;
}

/**
 * Merges values into one, or returns {@linkcode NEVER} if values are incompatible.
 */
export function mergeValues(a: any, b: any): any {
  if (isEqual(a, b)) {
    return a;
  }

  const aType = getValueType(a);
  const bType = getValueType(b);

  let output: any;

  if (aType !== bType) {
    return NEVER;
  }

  if (aType === TYPE_OBJECT) {
    output = Object.assign({}, a);

    for (const key in b) {
      if (key in output && setObjectProperty(output, key, mergeValues(output[key], b[key])) === NEVER) {
        return NEVER;
      } else {
        setObjectProperty(output, key, b[key]);
      }
    }
    return output;
  }

  if (aType === TYPE_ARRAY) {
    if (a.length !== b.length) {
      return NEVER;
    }

    output = a.slice(0);

    for (let i = 0; i < a.length; ++i) {
      if ((output[i] = mergeValues(a[i], b[i])) === NEVER) {
        return NEVER;
      }
    }
    return output;
  }

  if (aType === TYPE_DATE) {
    return a.getTime() === b.getTime() ? a : NEVER;
  }

  if (aType === TYPE_PROMISE) {
    return a;
  }

  if (aType === TYPE_SET) {
    return new Set(Array.from(a).concat(Array.from(b)));
  }

  if (aType === TYPE_MAP) {
    output = new Map(a);

    b.forEach((value: any, key: any) => {
      if (output === NEVER || (output.has(key) && (value = mergeValues(output.get(key), value)) === NEVER)) {
        output = NEVER;
        return;
      }
      output.set(key, value);
    });

    return output;
  }

  return NEVER;
}
