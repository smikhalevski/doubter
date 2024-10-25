import { coerceToConst, getConstCoercibleInputs } from '../coerce/const';
import { NEVER } from '../coerce/never';
import { CODE_TYPE_CONST, MESSAGE_TYPE_CONST } from '../constants';
import { IssueOptions, Message, ParseOptions, Result } from '../types';
import { createIssue } from '../utils';
import { Shape } from './Shape';

const nullInputs = Object.freeze<unknown[]>([null]);
const undefinedInputs = Object.freeze<unknown[]>([undefined]);

/**
 * The shape of a constant value.
 *
 * @template Value The expected constant value.
 * @group Shapes
 */
export class ConstShape<Value> extends Shape<Value> {
  /**
   * `true` if this shape coerces input values to the required type during parsing, or `false` otherwise.
   */
  isCoercing = false;

  /**
   * Returns `true` if an input is equal to the const value, or `false` otherwise.
   */
  protected _predicate: (input: unknown) => boolean;

  /**
   * The type issue options or the type issue message.
   */
  protected _options;

  /**
   * Creates a new {@link ConstShape} instance.
   *
   * @param value The expected value.
   * @param options The issue options or the issue message.
   * @template Value The expected value.
   */
  constructor(
    /**
     * The expected constant value.
     */
    readonly value: Value,
    options?: IssueOptions | Message
  ) {
    super();

    this._options = options;
    this._predicate = value !== value ? Number.isNaN : input => value === input;
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

  protected _getInputs(): readonly unknown[] {
    const { value } = this;

    if (this.isCoercing) {
      return getConstCoercibleInputs(value);
    }
    if (value === undefined) {
      return undefinedInputs;
    }
    if (value === null) {
      return nullInputs;
    }
    return [value];
  }

  protected _apply(input: unknown, options: ParseOptions, _nonce: number): Result<Value> {
    let output = input;

    if (!this._predicate(input) && (!this.isCoercing || (output = coerceToConst(this.value, input)) === NEVER)) {
      return [createIssue(CODE_TYPE_CONST, input, MESSAGE_TYPE_CONST, this.value, options, this._options)];
    }
    return this._applyOperations(input, output, options, null) as Result;
  }
}
