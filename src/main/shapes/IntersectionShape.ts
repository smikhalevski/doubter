import { CODE_INTERSECTION, MESSAGE_INTERSECTION } from '../constants';
import { ApplyOptions, ConstraintOptions, Issue, Message } from '../types';
import {
  applyShape,
  ARRAY,
  concatIssues,
  copyUnsafeChecks,
  createIssueFactory,
  DATE,
  distributeTypes,
  getShapeInputTypes,
  getTypeOf,
  isArray,
  isAsyncShape,
  isEqual,
  OBJECT,
  ok,
  setObjectProperty,
  toDeepPartialShape,
} from '../utils';
import { AnyShape, DeepPartialProtocol, DeepPartialShape, NEVER, Result, Shape } from './Shape';

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

  protected _getInputTypes(): unknown[] {
    return distributeTypes(this.shapes.map(getShapeInputTypes));
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
 * Merges values into one, or returns {@linkcode NEVER} if values are incompatible.
 */
export function mergeValues(a: any, b: any): any {
  if (isEqual(a, b)) {
    return a;
  }

  const aType = getTypeOf(a);
  const bType = getTypeOf(b);

  let output: any;

  if (aType !== bType) {
    return NEVER;
  }

  if (aType === OBJECT) {
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

  if (aType === ARRAY) {
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

  if (aType === DATE) {
    return a.getTime() === b.getTime() ? a : NEVER;
  }

  return NEVER;
}
