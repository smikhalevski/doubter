import { NEVER } from '../coerce/never';
import { coerceToString, stringCoercibleInputs } from '../coerce/string';
import { CODE_TYPE } from '../constants';
import { freeze } from '../internal/lang';
import { Type } from '../Type';
import { ApplyOptions, IssueOptions, Message, Result } from '../types';
import { createIssueFactory } from '../utils';
import { CoercibleShape } from './CoercibleShape';
import { Shape } from './Shape';

const stringInputs = freeze([Type.STRING]);

/**
 * The shape of a string value.
 *
 * @group Shapes
 */
export class StringShape extends CoercibleShape<string> {
  /**
   * Returns issues associated with an invalid input value type.
   */
  protected _typeIssueFactory;

  /**
   * Creates a new {@link StringShape} instance.
   *
   * @param options The issue options or the issue message.
   */
  constructor(options?: IssueOptions | Message) {
    super();

    this._typeIssueFactory = createIssueFactory(CODE_TYPE, Shape.messages['type.string'], options, Type.STRING);
  }

  protected _getInputs(): readonly unknown[] {
    return this.isCoercing ? stringCoercibleInputs : stringInputs;
  }

  protected _apply(input: any, options: ApplyOptions, nonce: number): Result<string> {
    let output = input;

    if (typeof output !== 'string' && (output = this._applyCoerce(input)) === NEVER) {
      return [this._typeIssueFactory(input, options)];
    }
    return this._applyOperations(input, output, options, null) as Result;
  }
}

StringShape.prototype['_coerce'] = coerceToString;
