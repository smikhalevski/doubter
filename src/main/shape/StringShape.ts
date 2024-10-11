import { NEVER } from '../coerce/never';
import { coerceToString, stringCoercibleInputs } from '../coerce/string';
import { CODE_TYPE_STRING, MESSAGE_TYPE_STRING } from '../constants';
import { Type } from '../Type';
import { IssueOptions, Message, ParseOptions, Result } from '../types';
import { createIssue } from '../utils';
import { Shape } from './Shape';

const stringInputs = Object.freeze([Type.STRING]);

/**
 * The shape of a string value.
 *
 * @group Shapes
 */
export class StringShape extends Shape<string, string> {
  /**
   * The type issue options or the type issue message.
   */
  protected _options;

  /**
   * Coerces an input value to a required type.
   *
   * @param input The input value to coerce.
   * @returns The coerced value, or {@link NEVER} if coercion isn't possible.
   */
  protected _applyCoerce?: (input: unknown) => string = undefined;

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
   * `true` if this shape coerces input values to the required type during parsing, or `false` otherwise.
   */
  get isCoercing() {
    return this._applyCoerce !== undefined;
  }

  /**
   * Enables an input value coercion.
   *
   * @returns The clone of the shape.
   */
  coerce(): this {
    const shape = this._clone();
    shape._applyCoerce = coerceToString;
    return shape;
  }

  protected _getInputs(): readonly unknown[] {
    return this.isCoercing ? stringCoercibleInputs : stringInputs;
  }

  protected _apply(input: any, options: ParseOptions, _nonce: number): Result<string> {
    let output = input;

    if (
      typeof output !== 'string' &&
      (this._applyCoerce === undefined || (output = this._applyCoerce(input)) === NEVER)
    ) {
      return [createIssue(CODE_TYPE_STRING, input, MESSAGE_TYPE_STRING, undefined, options, this._options)];
    }
    return this._applyOperations(input, output, options, null) as Result;
  }
}
