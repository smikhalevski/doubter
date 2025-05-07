import { coerceToUniqueArray } from '../coerce/array.js';
import { NEVER } from '../coerce/never.js';
import { CODE_TYPE_SET, MESSAGE_TYPE_SET } from '../constants.js';
import { toArrayIndex } from '../internal/arrays.js';
import { isArray } from '../internal/lang.js';
import { concatIssues, toDeepPartialShape, unshiftIssuesPath } from '../internal/shapes.js';
import { Type } from '../Type.js';
import { Issue, IssueOptions, Message, ParseOptions, Result } from '../types.js';
import { createIssue } from '../utils.js';
import { AnyShape, DeepPartialProtocol, Input, OptionalDeepPartialShape, Output, Shape } from './Shape.js';
import { ReadonlyShape } from './ReadonlyShape.js';

const setInputs = Object.freeze<unknown[]>([Type.SET]);

/**
 * The shape of a {@link !Set} instance.
 *
 * @template ValueShape The value shape.
 * @group Shapes
 */
export class SetShape<ValueShape extends AnyShape>
  extends Shape<Set<Input<ValueShape>>, Set<Output<ValueShape>>>
  implements DeepPartialProtocol<SetShape<OptionalDeepPartialShape<ValueShape>>>
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
   * Creates a new {@link SetShape} instance.
   *
   * @param valueShape The value shape.
   * @param options The issue options or the issue message.
   * @template ValueShape The value shape.
   */
  constructor(
    /**
     * The value shape.
     */
    readonly valueShape: ValueShape,
    options?: IssueOptions | Message
  ) {
    super();

    this._options = options;
  }

  at(key: unknown): AnyShape | null {
    return toArrayIndex(key) === -1 ? null : this.valueShape;
  }

  deepPartial(): SetShape<OptionalDeepPartialShape<ValueShape>> {
    return new SetShape<any>(toDeepPartialShape(this.valueShape).optional(), this._options);
  }

  /**
   * Marks a {@link !Set} as readonly.
   *
   * **Note:** This doesn't have any effect at runtime.
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
    return this.valueShape.isAsync;
  }

  protected _getInputs(): readonly unknown[] {
    return this.isCoercing ? this.valueShape.inputs.concat(Type.SET, Type.OBJECT, Type.ARRAY) : setInputs;
  }

  protected _apply(input: any, options: ParseOptions, nonce: number): Result<Set<Output<ValueShape>>> {
    let isChanged = false;
    let values;
    let issues = null;

    if (
      // Not a Set
      !(input instanceof Set && (values = Array.from(input))) &&
      // No coercion or not coercible
      (!this.isCoercing || !(isChanged = (values = coerceToUniqueArray(input)) !== NEVER))
    ) {
      return [createIssue(CODE_TYPE_SET, input, MESSAGE_TYPE_SET, undefined, options, this._options)];
    }

    const { valueShape } = this;
    const valuesLength = values.length;

    for (let i = 0; i < valuesLength; ++i) {
      const value = values[i];
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
      isChanged = true;
      values[i] = result.value;
    }

    return this._applyOperations(input, isChanged ? new Set(values) : input, options, issues) as Result;
  }

  protected _applyAsync(input: any, options: ParseOptions, nonce: number): Promise<Result<Set<Output<ValueShape>>>> {
    return new Promise(resolve => {
      let isChanged = false;
      let values;

      if (
        // Not a Set
        !(input instanceof Set && (values = Array.from(input))) &&
        // No coercion or not coercible
        (!this.isCoercing || !(isChanged = (values = coerceToUniqueArray(input)) !== NEVER))
      ) {
        resolve([createIssue(CODE_TYPE_SET, input, MESSAGE_TYPE_SET, undefined, options, this._options)]);
        return;
      }

      const { valueShape } = this;
      const valuesLength = values.length;

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
          } else {
            isChanged = true;
            values[index] = result.value;
          }
        }
        return next();
      };

      const next = (): Result | Promise<Result> => {
        index++;

        if (index !== valuesLength) {
          return valueShape['_applyAsync'](values[index], options, nonce).then(handleResult);
        }
        return this._applyOperations(input, isChanged ? new Set(values) : input, options, issues);
      };

      resolve(next());
    });
  }
}
