import { booleanCoercibleInputs, coerceToBoolean } from '../coerce/boolean';
import { NEVER } from '../coerce/never';
import { CODE_TYPE } from '../constants';
import { freeze } from '../internal/lang';
import { Type } from '../Type';
import { ApplyOptions, IssueOptions, Message, Result } from '../types';
import { createIssueFactory } from '../utils';
import { CoercibleShape } from './CoercibleShape';
import { Shape } from './Shape';

const booleanInputs = freeze([Type.BOOLEAN]);

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

    this._typeIssueFactory = createIssueFactory(CODE_TYPE, Shape.messages['type.boolean'], options, Type.BOOLEAN);
  }

  protected _getInputs(): readonly unknown[] {
    return this.isCoercing ? booleanCoercibleInputs : booleanInputs;
  }

  protected _apply(input: any, options: ApplyOptions, nonce: number): Result<boolean> {
    let output = input;

    if (typeof output !== 'boolean' && (output = this._applyCoerce(input)) === NEVER) {
      return [this._typeIssueFactory(input, options)];
    }
    return this._applyOperations(input, output, options, null) as Result;
  }
}

BooleanShape.prototype['_coerce'] = coerceToBoolean;
