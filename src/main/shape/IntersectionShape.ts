import { NEVER } from '../coerce/never';
import { CODE_TYPE_INTERSECTION, MESSAGE_TYPE_INTERSECTION } from '../constants';
import { isArray, isEqual } from '../internal/lang';
import { setObjectProperty } from '../internal/objects';
import { applyShape, concatIssues, isAsyncShapes, toDeepPartialShape } from '../internal/shapes';
import { distributeTypes } from '../internal/types';
import { Type } from '../Type';
import { ApplyOptions, Issue, IssueOptions, Message, Result } from '../types';
import { createIssue } from '../utils';
import { AnyShape, DeepPartialProtocol, DeepPartialShape, Input, Output, Shape } from './Shape';

/**
 * Converts union to intersection.
 */
// prettier-ignore
type Intersect<U extends AnyShape> =
  (U extends any ? (k: U) => void : never) extends (k: infer I) => void ? I extends Shape ? I : never : never;

type DeepPartialIntersectionShape<Shapes extends readonly AnyShape[]> = IntersectionShape<{
  [K in keyof Shapes]: DeepPartialShape<Shapes[K]>;
}>;

/**
 * The shape that requires an input to conform all given shapes.
 *
 * @template Shapes The array of shapes that comprise an intersection.
 * @group Shapes
 */
export class IntersectionShape<Shapes extends readonly AnyShape[]>
  extends Shape<Input<Intersect<Shapes[number]>>, Output<Intersect<Shapes[number]>>>
  implements DeepPartialProtocol<DeepPartialIntersectionShape<Shapes>>
{
  /**
   * The intersection constraint options or an issue message.
   */
  protected _options;

  /**
   * Creates a new {@link IntersectionShape} instance.
   *
   * @param shapes The array of shapes that comprise an intersection.
   * @param options The intersection constraint options or an issue message.
   * @template Shapes The array of shapes that comprise an intersection.
   */
  constructor(
    /**
     * The array of shapes that comprise an intersection.
     */
    readonly shapes: Shapes,
    options?: IssueOptions | Message
  ) {
    super();

    this._options = options;
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

  deepPartial(): DeepPartialIntersectionShape<Shapes> {
    return new IntersectionShape<any>(this.shapes.map(toDeepPartialShape), this._options);
  }

  protected _isAsync(): boolean {
    return isAsyncShapes(this.shapes);
  }

  protected _getInputs(): readonly unknown[] {
    const inputs = [];

    for (const shape of this.shapes) {
      inputs.push(shape.inputs);
    }
    return distributeTypes(inputs);
  }

  protected _apply(input: any, options: ApplyOptions, nonce: number): Result<Output<Intersect<Shapes[number]>>> {
    const { shapes } = this;
    const shapesLength = shapes.length;

    let outputs = null;
    let issues = null;

    for (let i = 0; i < shapesLength; ++i) {
      const result = shapes[i]['_apply'](input, options, nonce);

      if (result === null) {
        continue;
      }
      if (isArray(result)) {
        if (options.earlyReturn) {
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

  protected _applyAsync(
    input: any,
    options: ApplyOptions,
    nonce: number
  ): Promise<Result<Output<Intersect<Shapes[number]>>>> {
    return new Promise(resolve => {
      const { shapes } = this;
      const shapesLength = shapes.length;

      let outputs: unknown[] | null = null;
      let issues: Issue[] | null = null;
      let index = -1;

      const handleResult = (result: Result) => {
        if (result !== null) {
          if (isArray(result)) {
            if (options.earlyReturn) {
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
          return applyShape(shapes[index], input, options, nonce, handleResult);
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
  ): Result<Output<Intersect<Shapes[number]>>> {
    let output = input;

    if (outputs !== null) {
      let outputsLength = outputs.length;

      if (outputsLength !== this.shapes.length) {
        outputsLength = outputs.push(input);
      }

      output = outputs[0];

      for (let i = 1; i < outputsLength && output !== NEVER; ++i) {
        output = mergeValues(output, outputs[i]);
      }
      if (output === NEVER) {
        return [
          createIssue(CODE_TYPE_INTERSECTION, input, MESSAGE_TYPE_INTERSECTION, undefined, options, this._options),
        ];
      }
    }
    return this._applyOperations(input, output, options, null) as Result;
  }
}

/**
 * Merges values into one, or returns {@link NEVER} if values are incompatible.
 */
export function mergeValues(a: any, b: any): any {
  if (isEqual(a, b)) {
    return a;
  }

  const aType = Type.of(a);
  const bType = Type.of(b);

  let output: any;

  if (aType !== bType) {
    return NEVER;
  }

  if (aType === Type.OBJECT) {
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

  if (aType === Type.ARRAY) {
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

  if (aType === Type.DATE) {
    return a.getTime() === b.getTime() ? a : NEVER;
  }

  return NEVER;
}
