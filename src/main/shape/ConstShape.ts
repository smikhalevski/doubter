import { createCoerceToConst } from '../coerce/createCoerceToConst';
import { CODE_TYPE_CONST } from '../constants';
import { ApplyOptions, IssueOptions, Message, Result } from '../types';
import { createIssueFactory } from '../utils';
import { CoercibleShape } from './CoercibleShape';
import { NEVER } from './Shape';

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
    super(createCoerceToConst(value));

    this._typePredicate = value !== value ? Number.isNaN : input => value === input;
    this._typeIssueFactory = createIssueFactory(CODE_TYPE_CONST, Shape.messages[CODE_TYPE_CONST], options, value);
  }

  protected _getInputs(): unknown[] {
    if (this.isCoercing) {
      return [];
    } else {
      return [this.value];
    }
  }

  protected _apply(input: unknown, options: ApplyOptions, nonce: number): Result<Value> {
    let output = input;

    if (
      !this._typePredicate(input) &&
      (!(options.coerce || this.isCoercing) || (output = this._coerce(input)) === NEVER)
    ) {
      return [this._typeIssueFactory(input, options)];
    }
    return this._applyOperations(input, output, options, null);
  }
}
