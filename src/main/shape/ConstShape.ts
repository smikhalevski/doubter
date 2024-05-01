import { coerceToConst, getConstCoercibleInputs } from '../coerce/const';
import { NEVER } from '../coerce/never';
import { CODE_TYPE_CONST, MESSAGE_TYPE_CONST } from '../constants';
import { ApplyOptions, IssueOptions, Message, Result } from '../types';
import { createIssue } from '../utils';
import { CoercibleShape } from './CoercibleShape';

const nullInputs = Object.freeze([null]);
const undefinedInputs = Object.freeze([undefined]);

/**
 * The shape of a constant value.
 *
 * @template Value The expected constant value.
 * @group Shapes
 */
export class ConstShape<Value> extends CoercibleShape<Value> {
  /**
   * Returns `true` if an input is equal to the const value, or `false` otherwise.
   */
  protected _predicate: (input: unknown) => boolean;

  /**
   * Returns issues associated with an invalid input value type.
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

  protected _coerce(input: unknown): Value {
    return coerceToConst(this.value, input);
  }

  protected _apply(input: unknown, options: ApplyOptions, nonce: number): Result<Value> {
    let output = input;

    if (!this._predicate(input) && (output = this._applyCoerce(input)) === NEVER) {
      return [createIssue(CODE_TYPE_CONST, input, MESSAGE_TYPE_CONST, this.value, options, this._options)];
    }
    return this._applyOperations(input, output, options, null) as Result;
  }
}
