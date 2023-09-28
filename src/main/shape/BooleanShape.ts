import { coerceToBoolean } from '../coerce/coerceToBoolean';
import { NEVER } from '../coerce/NEVER';
import { CODE_TYPE } from '../constants';
import { TYPE_ARRAY, TYPE_BOOLEAN, TYPE_OBJECT } from '../Type';
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
    super();

    this._typeIssueFactory = createIssueFactory(CODE_TYPE, Shape.messages['type.boolean'], options, TYPE_BOOLEAN);
  }

  protected _getInputs(): unknown[] {
    if (this.isCoercing) {
      return [TYPE_ARRAY, TYPE_OBJECT, TYPE_BOOLEAN, 'false', 'true', 0, 1, null, undefined];
    } else {
      return [TYPE_BOOLEAN];
    }
  }

  protected _apply(input: any, options: ApplyOptions, nonce: number): Result<boolean> {
    let output = input;

    if (typeof output !== 'boolean' && (output = this._applyCoercion(input, options.coerce)) === NEVER) {
      return [this._typeIssueFactory(input, options)];
    }
    return this._applyOperations(input, output, options, null);
  }
}

BooleanShape.prototype['_coerce'] = coerceToBoolean;
