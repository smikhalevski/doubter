import { bigintCoercibleInputs, coerceToBigInt } from '../coerce/bigint';
import { NEVER } from '../coerce/never';
import { CODE_TYPE_BIGINT, MESSAGE_TYPE_BIGINT } from '../constants';
import { Type } from '../Type';
import { IssueOptions, Message, ParseOptions, Result } from '../types';
import { createIssue } from '../utils';
import { CoercibleShape } from './CoercibleShape';

const bigintInputs = Object.freeze([Type.BIGINT]);

/**
 * The shape of a bigint value.
 *
 * @group Shapes
 */
export class BigIntShape extends CoercibleShape<bigint> {
  /**
   * The type issue options or the type issue message.
   */
  protected _options;

  /**
   * Creates a new {@link BigIntShape} instance.
   *
   * @param options The issue options or the issue message.
   */
  constructor(options?: IssueOptions | Message) {
    super();

    this._options = options;
  }

  protected _getInputs(): readonly unknown[] {
    return this.isCoercing ? bigintCoercibleInputs : bigintInputs;
  }

  protected _apply(input: any, options: ParseOptions, _nonce: number): Result<bigint> {
    let output = input;

    if (typeof output !== 'bigint' && (output = this._applyCoerce(input)) === NEVER) {
      return [createIssue(CODE_TYPE_BIGINT, input, MESSAGE_TYPE_BIGINT, undefined, options, this._options)];
    }
    return this._applyOperations(input, output, options, null) as Result;
  }
}

BigIntShape.prototype['_coerce'] = coerceToBigInt;
