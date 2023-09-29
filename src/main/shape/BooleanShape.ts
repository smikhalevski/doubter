import { booleanCoercibleTypes, coerceToBoolean } from '../coerce/boolean';
import { NEVER } from '../coerce/never';
import { CODE_TYPE } from '../constants';
import { TYPE_BOOLEAN } from '../Type';
import { ApplyOptions, IssueOptions, Message, Result } from '../types';
import { createIssueFactory } from '../utils';
import { CoercibleShape } from './CoercibleShape';

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

  protected _getInputs(): readonly unknown[] {
    return [TYPE_BOOLEAN];
  }

  protected _getCoercibleInputs(): readonly unknown[] {
    return booleanCoercibleTypes;
  }

  protected _apply(input: any, options: ApplyOptions, nonce: number): Result<boolean> {
    let output = input;

    if (typeof output !== 'boolean' && (output = this._tryCoerce(input, options.coerce)) === NEVER) {
      return [this._typeIssueFactory(input, options)];
    }
    return this._applyOperations(input, output, options, null);
  }
}
