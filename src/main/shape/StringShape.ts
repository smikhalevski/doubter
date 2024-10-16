import { NEVER } from '../coerce/never';
import { coerceToString, stringCoercibleInputs } from '../coerce/string';
import { CODE_TYPE_STRING, MESSAGE_TYPE_STRING } from '../constants';
import { Type } from '../Type';
import { IssueOptions, Message, ParseOptions, Result } from '../types';
import { createIssue } from '../utils';
import { CoercibleShape } from './CoercibleShape';

const stringInputs = Object.freeze([Type.STRING]);

/**
 * The shape of a string value.
 *
 * @group Shapes
 */
export class StringShape extends CoercibleShape<string> {
  /**
   * The type issue options or the type issue message.
   */
  protected _options;

  /**
   * Creates a new {@link StringShape} instance.
   *
   * @param options The issue options or the issue message.
   */
  constructor(options?: IssueOptions | Message) {
    super();

    this._options = options;
  }

  protected _getInputs(): readonly unknown[] {
    return this.isCoercing ? stringCoercibleInputs : stringInputs;
  }

  protected _coerce(input: unknown): string {
    return coerceToString(input);
  }

  protected _apply(input: any, options: ParseOptions, _nonce: number): Result<string> {
    let output = input;

    if (typeof output !== 'string' && (output = this._applyCoerce(input)) === NEVER) {
      return [createIssue(CODE_TYPE_STRING, input, MESSAGE_TYPE_STRING, undefined, options, this._options)];
    }
    return this._applyOperations(input, output, options, null) as Result;
  }
}
