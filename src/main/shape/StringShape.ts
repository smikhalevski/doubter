import { NEVER } from '../coerce/never';
import { coerceToString, stringCoercibleInputs } from '../coerce/string';
import { CODE_TYPE, MESSAGE_TYPE_STRING } from '../constants';
import { Type } from '../Type';
import { ApplyOptions, IssueOptions, Message, Result } from '../types';
import { createIssue, toIssueOptions } from '../utils';
import { CoercibleShape } from './CoercibleShape';

const stringInputs = Object.freeze([Type.STRING]);

/**
 * The shape of a string value.
 *
 * @group Shapes
 */
export class StringShape extends CoercibleShape<string> {
  /**
   * Returns issues associated with an invalid input value type.
   */
  protected _options;

  /**
   * Creates a new {@link StringShape} instance.
   *
   * @param options The issue options or the issue message.
   */
  constructor(options?: IssueOptions | Message) {
    super();

    this._options = toIssueOptions(options);
  }

  protected _getInputs(): readonly unknown[] {
    return this.isCoercing ? stringCoercibleInputs : stringInputs;
  }

  protected _apply(input: any, options: ApplyOptions, nonce: number): Result<string> {
    let output = input;

    if (typeof output !== 'string' && (output = this._applyCoerce(input)) === NEVER) {
      return [createIssue(CODE_TYPE, input, MESSAGE_TYPE_STRING, Type.STRING, options, this._options)];
    }
    return this._applyOperations(input, output, options, null) as Result;
  }
}

StringShape.prototype['_coerce'] = coerceToString;
