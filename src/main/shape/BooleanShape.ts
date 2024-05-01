import { booleanCoercibleInputs, coerceToBoolean } from '../coerce/boolean';
import { NEVER } from '../coerce/never';
import { CODE_TYPE_BOOLEAN, MESSAGE_TYPE_BOOLEAN } from '../constants';
import { Type } from '../Type';
import { ApplyOptions, IssueOptions, Message, Result } from '../types';
import { createIssue } from '../utils';
import { CoercibleShape } from './CoercibleShape';

const booleanInputs = Object.freeze([Type.BOOLEAN]);

/**
 * The shape of a boolean value.
 *
 * @group Shapes
 */
export class BooleanShape extends CoercibleShape<boolean> {
  /**
   * Returns issues associated with an invalid input value type.
   */
  protected _options;

  /**
   * Creates a new {@link BooleanShape} instance.
   *
   * @param options The issue options or the issue message.
   */
  constructor(options?: IssueOptions | Message) {
    super();

    this._options = options;
  }

  protected _getInputs(): readonly unknown[] {
    return this.isCoercing ? booleanCoercibleInputs : booleanInputs;
  }

  protected _apply(input: any, options: ApplyOptions, nonce: number): Result<boolean> {
    let output = input;

    if (typeof output !== 'boolean' && (output = this._applyCoerce(input)) === NEVER) {
      return [createIssue(CODE_TYPE_BOOLEAN, input, MESSAGE_TYPE_BOOLEAN, undefined, options, this._options)];
    }
    return this._applyOperations(input, output, options, null) as Result;
  }
}

BooleanShape.prototype['_coerce'] = coerceToBoolean;
