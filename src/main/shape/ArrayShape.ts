import { coerceToArray } from '../coerce/array';
import { NEVER } from '../coerce/never';
import { CODE_TYPE_ARRAY, CODE_TYPE_TUPLE, MESSAGE_TYPE_ARRAY, MESSAGE_TYPE_TUPLE } from '../constants';
import { toArrayIndex } from '../internal/arrays';
import { isArray } from '../internal/lang';
import { applyShape, concatIssues, isAsyncShapes, toDeepPartialShape, unshiftIssuesPath } from '../internal/shapes';
import { Type } from '../Type';
import { Issue, IssueOptions, Message, ParseOptions, Result } from '../types';
import { createIssue } from '../utils';
import { ReadonlyShape } from './ReadonlyShape';
import { AnyShape, DeepPartialProtocol, INPUT, OptionalDeepPartialShape, OUTPUT, Shape, unknownInputs } from './Shape';

const arrayInputs = Object.freeze<unknown[]>([Type.ARRAY]);
const arrayCoercibleInputs = Object.freeze<unknown[]>([Type.OBJECT, Type.ARRAY]);

type InferArray<
  HeadShapes extends readonly AnyShape[],
  RestShape extends AnyShape | null,
  Leg extends INPUT | OUTPUT,
> = [
  ...{ [K in keyof HeadShapes]: HeadShapes[K][Leg] },
  ...(RestShape extends null | undefined ? [] : RestShape extends Shape ? RestShape[Leg][] : []),
];

type DeepPartialArrayShape<HeadShapes extends readonly AnyShape[], RestShape extends AnyShape | null> = ArrayShape<
  { [K in keyof HeadShapes]: OptionalDeepPartialShape<HeadShapes[K]> },
  RestShape extends null | undefined ? null : RestShape extends Shape ? OptionalDeepPartialShape<RestShape> : RestShape
>;

/**
 * The shape of an array or a tuple value.
 *
 * | Shape | Input Type | Output Type |
 * | :-- | :-- | :-- |
 * | `ArrayShape<[], null>` | `[]` | `[]` |
 * | `ArrayShape<[], Shape<A, B>>` | `A[]` | `B[]` |
 * | `ArrayShape<​[Shape<A, B>, Shape<X, Y>], null>` | `[A, X]` | `[B, Y]` |
 * | `ArrayShape<​[Shape<A, B>], Shape<X, Y>>` | `[A, ...X[]]` | `[B, ...Y[]]` |
 *
 * @template HeadShapes The array of positioned element shapes.
 * @template RestShape The shape of rest elements, or `null` if there are no rest elements.
 * @group Shapes
 */
export class ArrayShape<HeadShapes extends readonly AnyShape[], RestShape extends AnyShape | null>
  extends Shape<InferArray<HeadShapes, RestShape, INPUT>, InferArray<HeadShapes, RestShape, OUTPUT>>
  implements DeepPartialProtocol<DeepPartialArrayShape<HeadShapes, RestShape>>
{
  /**
   * `true` if this shape coerces input values to the required type during parsing, or `false` otherwise.
   */
  isCoercing = false;

  /**
   * The type issue options or the type issue message.
   */
  protected _options;

  /**
   * Creates a new {@link ArrayShape} instance.
   *
   * @param headShapes The array of positioned element shapes.
   * @param restShape The shape of rest elements or `null` if there are no rest elements.
   * @param options The issue options or the issue message.
   * @template HeadShapes The array of positioned element shapes.
   * @template RestShape The shape of rest elements, or `null` if there are no rest elements.
   */
  constructor(
    /**
     * The array of positioned element shapes.
     */
    readonly headShapes: HeadShapes,
    /**
     * The shape of rest elements or `null` if there are no rest elements.
     */
    readonly restShape: RestShape,
    options?: IssueOptions | Message
  ) {
    super();

    this._options = options;
  }

  at(key: unknown): AnyShape | null {
    const index = toArrayIndex(key);

    if (index === -1) {
      return null;
    }
    if (index < this.headShapes.length) {
      return this.headShapes[index];
    }
    return this.restShape;
  }

  /**
   * Returns an array shape that has rest elements constrained by the given shape.
   *
   * **Note:** This method returns a shape without any operations.
   *
   * @param restShape The shape of rest elements, or `null` if there are no rest elements.
   * @returns The new array shape.
   * @template S The shape of rest elements.
   */
  rest<S extends AnyShape | null>(restShape: S): ArrayShape<HeadShapes, S> {
    return new ArrayShape(this.headShapes, restShape, this._options);
  }

  deepPartial(): DeepPartialArrayShape<HeadShapes, RestShape> {
    const headShapes = this.headShapes.map(shape => toDeepPartialShape(shape).optional());

    const restShape = this.restShape !== null ? toDeepPartialShape(this.restShape).optional() : null;

    return new ArrayShape<any, any>(headShapes, restShape, this._options);
  }

  /**
   * Makes an array readonly: array elements cannot be added, removed or updated at runtime.
   */
  readonly(): ReadonlyShape<this> {
    return new ReadonlyShape(this);
  }

  /**
   * Enables an input value coercion.
   *
   * @returns The clone of the shape.
   */
  coerce(): this {
    const shape = this._clone();
    shape.isCoercing = true;
    return shape;
  }

  protected _isAsync(): boolean {
    return isAsyncShapes(this.headShapes) || this.restShape?.isAsync || false;
  }

  protected _getInputs(): readonly unknown[] {
    const { headShapes, restShape } = this;

    if (!this.isCoercing) {
      return arrayInputs;
    }
    if (headShapes.length > 1) {
      return arrayCoercibleInputs;
    }
    if (headShapes.length === 1) {
      return headShapes[0].inputs.concat(Type.OBJECT, Type.ARRAY);
    }
    if (restShape !== null) {
      return restShape.inputs.concat(Type.OBJECT, Type.ARRAY);
    }
    return unknownInputs;
  }

  protected _apply(
    input: any,
    options: ParseOptions,
    nonce: number
  ): Result<InferArray<HeadShapes, RestShape, OUTPUT>> {
    const { headShapes, restShape, operations } = this;

    let output = input;
    let outputLength;
    let headShapesLength = headShapes.length;
    let issues = null;

    if (
      // Not an array or not coercible
      (!isArray(output) && (!this.isCoercing || (output = coerceToArray(input)) === NEVER)) ||
      // Invalid tuple length
      (outputLength = output.length) < headShapesLength ||
      (restShape === null && outputLength !== headShapesLength)
    ) {
      return [
        headShapes.length !== 0 || restShape === null
          ? createIssue(CODE_TYPE_TUPLE, input, MESSAGE_TYPE_TUPLE, headShapes.length, options, this._options)
          : createIssue(CODE_TYPE_ARRAY, input, MESSAGE_TYPE_ARRAY, undefined, options, this._options),
      ];
    }

    if (headShapesLength !== 0 || restShape !== null) {
      for (let i = 0; i < outputLength; ++i) {
        const value = output[i];
        const valueShape = i < headShapesLength ? headShapes[i] : restShape!;
        const result = valueShape['_apply'](value, options, nonce);

        if (result === null) {
          continue;
        }
        if (isArray(result)) {
          unshiftIssuesPath(result, i);

          if (options.earlyReturn) {
            return result;
          }
          issues = concatIssues(issues, result);
          continue;
        }
        if (issues === null || operations.length !== 0) {
          if (input === output) {
            output = input.slice(0);
          }
          output[i] = result.value;
        }
      }
    }
    return this._applyOperations(input, output, options, issues) as Result;
  }

  protected _applyAsync(
    input: any,
    options: ParseOptions,
    nonce: number
  ): Promise<Result<InferArray<HeadShapes, RestShape, OUTPUT>>> {
    return new Promise(resolve => {
      const { headShapes, restShape, operations } = this;

      let output = input;
      let outputLength: number;
      let headShapesLength = headShapes.length;

      if (
        // Not an array or not coercible
        (!isArray(output) && (!this.isCoercing || (output = coerceToArray(input)) === NEVER)) ||
        // Invalid tuple length
        (outputLength = output.length) < headShapesLength ||
        (restShape === null && outputLength !== headShapesLength)
      ) {
        resolve([
          headShapes.length !== 0 || restShape === null
            ? createIssue(CODE_TYPE_TUPLE, input, MESSAGE_TYPE_TUPLE, headShapes.length, options, this._options)
            : createIssue(CODE_TYPE_ARRAY, input, MESSAGE_TYPE_ARRAY, undefined, options, this._options),
        ]);
        return;
      }

      let issues: Issue[] | null = null;
      let index = -1;

      const handleResult = (result: Result) => {
        if (result !== null) {
          if (isArray(result)) {
            unshiftIssuesPath(result, index);

            if (options.earlyReturn) {
              return result;
            }
            issues = concatIssues(issues, result);
          } else if (issues === null || operations.length !== 0) {
            if (input === output) {
              output = input.slice(0);
            }
            output[index] = result.value;
          }
        }
        return next();
      };

      const next = (): Result | Promise<Result> => {
        index++;

        if (index !== outputLength && (headShapesLength !== 0 || restShape !== null)) {
          return applyShape(
            index < headShapesLength ? headShapes[index] : restShape!,
            output[index],
            options,
            nonce,
            handleResult
          );
        }

        return this._applyOperations(input, output, options, issues);
      };

      resolve(next());
    });
  }
}
