import { NEVER } from '../coerce/never.ts';
import { coerceToString, stringCoercibleInputs } from '../coerce/string.ts';
import { CODE_TYPE_STRING, MESSAGE_TYPE_STRING } from '../constants.ts';
import { Type } from '../Type.ts';
import { IssueOptions, Message, ParseOptions, Result } from '../types.ts';
import { createIssue } from '../utils.ts';
import { Shape } from './Shape.ts';

const stringInputs = Object.freeze<unknown[]>([Type.STRING]);

/**
 * The shape of a string value.
 *
 * @group Shapes
 */
export class StringShape extends Shape<string, string> {
  /**
   * `true` if this shape coerces input values to the required type during parsing, or `false` otherwise.
   */
  isCoercing = false;

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

  /**
   * Enables an input value coercion.
   *
   * @returns The clone of the shape.
   */
  coerce(): this {
    const shape = this._clone();
    shape.isCoercing = true;
    return shape;
  }

  protected _getInputs(): readonly unknown[] {
    return this.isCoercing ? stringCoercibleInputs : stringInputs;
  }

  protected _apply(input: any, options: ParseOptions, _nonce: number): Result<string> {
    let output = input;

    if (typeof output !== 'string' && (!this.isCoercing || (output = coerceToString(input)) === NEVER)) {
      return [createIssue(CODE_TYPE_STRING, input, MESSAGE_TYPE_STRING, undefined, options, this._options)];
    }
    return this._applyOperations(input, output, options, null) as Result;
  }
}
