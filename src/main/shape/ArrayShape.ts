import { NEVER } from '../coerce/never';
import { CODE_TYPE, CODE_TYPE_TUPLE } from '../constants';
import { toArrayIndex } from '../internal/arrays';
import { getCanonicalValue, isArray, isIterableObject } from '../internal/lang';
import {
  applyShape,
  concatIssues,
  INPUT,
  isAsyncShapes,
  OUTPUT,
  toDeepPartialShape,
  unshiftIssuesPath,
} from '../internal/shapes';
import { arrayCoercibleInputs, arrayInputs, TYPE_ARRAY, TYPE_OBJECT, unknownInputs } from '../types';
import { ApplyOptions, Issue, IssueOptions, Message, Result } from '../typings';
import { createIssueFactory } from '../utils';
import { CoercibleShape } from './CoercibleShape';
import { AnyShape, DeepPartialProtocol, OptionalDeepPartialShape, Shape } from './Shape';

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
 * | Shape | Type |
 * | :-- | :-- |
 * | `ArrayShape<[], null>` | `[]` |
 * | `ArrayShape<[], Shape<B>>` | `B[]` |
 * | `ArrayShape<[Shape<A>, Shape<B>], null>` | `[A, B]` |
 * | `ArrayShape<[Shape<A>], Shape<B>>` | `[A, ...B[]]` |
 *
 * @template HeadShapes The array of positioned element shapes.
 * @template RestShape The shape of rest elements, or `null` if there are no rest elements.
 * @group Shapes
 */
export class ArrayShape<HeadShapes extends readonly AnyShape[], RestShape extends AnyShape | null>
  extends CoercibleShape<InferArray<HeadShapes, RestShape, INPUT>, InferArray<HeadShapes, RestShape, OUTPUT>, unknown[]>
  implements DeepPartialProtocol<DeepPartialArrayShape<HeadShapes, RestShape>>
{
  /**
   * The type constraint options or the type issue message.
   */
  protected _options;

  /**
   * Returns issues associated with an invalid input value type.
   */
  protected _typeIssueFactory;

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

    if (headShapes.length !== 0 || restShape === null) {
      this._typeIssueFactory = createIssueFactory(
        CODE_TYPE_TUPLE,
        Shape.messages[CODE_TYPE_TUPLE],
        options,
        headShapes.length
      );
    } else {
      this._typeIssueFactory = createIssueFactory(CODE_TYPE, Shape.messages['type.array'], options, TYPE_ARRAY);
    }
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
      return headShapes[0].inputs.concat(TYPE_OBJECT, TYPE_ARRAY);
    }
    if (restShape !== null) {
      return restShape.inputs.concat(TYPE_OBJECT, TYPE_ARRAY);
    }
    return unknownInputs;
  }

  /**
   * Coerces a value to an array.
   *
   * @param input The value to coerce.
   * @returns An array, or {@link NEVER} if coercion isn't possible.
   */
  protected _coerce(input: unknown): unknown[] {
    if (isIterableObject(getCanonicalValue(input))) {
      return Array.from(input as Iterable<unknown>);
    }
    return [input];
  }

  protected _apply(
    input: any,
    options: ApplyOptions,
    nonce: number
  ): Result<InferArray<HeadShapes, RestShape, OUTPUT>> {
    const { headShapes, restShape, operations } = this;

    let output = input;
    let outputLength;
    let headShapesLength = headShapes.length;
    let issues = null;

    if (
      // Not an array or not coercible
      (!isArray(output) && (output = this._applyCoerce(input)) === NEVER) ||
      // Invalid tuple length
      (outputLength = output.length) < headShapesLength ||
      (restShape === null && outputLength !== headShapesLength)
    ) {
      return [this._typeIssueFactory(input, options)];
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
    options: ApplyOptions,
    nonce: number
  ): Promise<Result<InferArray<HeadShapes, RestShape, OUTPUT>>> {
    return new Promise(resolve => {
      const { headShapes, restShape, operations } = this;

      let output = input;
      let outputLength: number;
      let headShapesLength = headShapes.length;

      if (
        // Not an array or not coercible
        (!isArray(output) && (output = this._applyCoerce(input)) === NEVER) ||
        // Invalid tuple length
        (outputLength = output.length) < headShapesLength ||
        (restShape === null && outputLength !== headShapesLength)
      ) {
        resolve([this._typeIssueFactory(input, options)]);
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
