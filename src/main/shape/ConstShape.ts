import { coerceToConst, getConstCoercibleTypes } from '../coerce/const';
import { NEVER } from '../coerce/never';
import { CODE_TYPE_CONST } from '../constants';
import { TypeArray } from '../Type';
import { ApplyOptions, IssueOptions, Message, Result } from '../typings';
import { createIssueFactory } from '../utils';
import { CoercibleShape } from './CoercibleShape';
import { Shape } from './Shape';

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
  protected _typePredicate: (input: unknown) => boolean;

  /**
   * Returns issues associated with an invalid input value type.
   */
  protected _typeIssueFactory;

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

    this._typePredicate = value !== value ? Number.isNaN : input => value === input;
    this._typeIssueFactory = createIssueFactory(CODE_TYPE_CONST, Shape.messages[CODE_TYPE_CONST], options, value);
  }

  protected _getInputs(): TypeArray {
    return [this.value];
  }

  protected _getCoercibleInputs(): TypeArray {
    return getConstCoercibleTypes(this.value);
  }

  protected _coerce(input: unknown): Value {
    return coerceToConst(this.value, input);
  }

  protected _apply(input: unknown, options: ApplyOptions, nonce: number): Result<Value> {
    let output = input;

    if (!this._typePredicate(input) && (output = this._tryCoerce(input, options.coerce)) === NEVER) {
      return [this._typeIssueFactory(input, options)];
    }
    return this._applyOperations(input, output, options, null);
  }
}
