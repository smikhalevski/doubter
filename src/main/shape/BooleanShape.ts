import { coerceToBoolean } from '../coerce';
import { CODE_TYPE } from '../constants';
import { TYPE_ARRAY, TYPE_BOOLEAN, TYPE_NUMBER, TYPE_OBJECT, TYPE_STRING } from '../Type';
import { ApplyOptions, IssueOptions, Message, Result } from '../types';
import { createIssueFactory } from '../utils';
import { CoercibleShape } from './CoercibleShape';
import { NEVER, Shape } from './Shape';

/**
 * The shape of a boolean value.
 *
 * @group Shapes
 */
export class BooleanShape extends CoercibleShape<boolean> {
  /**
   * Returns issues associated with an invalid input value type.
   */
  protected _typeIssueFactory;

  /**
   * Creates a new {@link BooleanShape} instance.
   *
   * @param options The issue options or the issue message.
   */
  constructor(options?: IssueOptions | Message) {
    super(coerceToBoolean);

    this._typeIssueFactory = createIssueFactory(CODE_TYPE, Shape.messages['type.boolean'], options, TYPE_BOOLEAN);
  }

  protected _getInputs(): unknown[] {
    if (this.isCoercing) {
      return [TYPE_BOOLEAN, TYPE_OBJECT, TYPE_STRING, TYPE_NUMBER, TYPE_ARRAY, null, undefined];
    } else {
      return [TYPE_BOOLEAN];
    }
  }

  protected _apply(input: any, options: ApplyOptions, nonce: number): Result<boolean> {
    let output = input;

    if (
      typeof output !== 'boolean' &&
      (!(options.coerce || this.isCoercing) || (output = this._coerce(input)) === NEVER)
    ) {
      return [this._typeIssueFactory(input, options)];
    }
    return this._applyOperations(input, output, options, null);
  }
}
