import { NEVER } from '../coerce/never';
import { coerceToNumber, numberCoercibleInputs } from '../coerce/number';
import { CODE_TYPE_NUMBER, MESSAGE_TYPE_NUMBER } from '../constants';
import { Type } from '../Type';
import { Any, IssueOptions, Message, ParseOptions, Result } from '../types';
import { createIssue } from '../utils';
import { CoercibleShape } from './CoercibleShape';
import { AllowShape, ReplaceShape } from './Shape';

const numberInputs = Object.freeze([Type.NUMBER]);

/**
 * The shape of a number value.
 *
 * @group Shapes
 */
export class NumberShape extends CoercibleShape<number> {
  /**
   * The type issue options or the type issue message.
   */
  protected _options;

  /**
   * Creates a new {@link NumberShape} instance.
   *
   * @param options The issue options or the issue message.
   */
  constructor(options?: IssueOptions | Message) {
    super();

    this._options = options;
  }

  /**
   * Allows `NaN` as an input and output value.
   */
  nan(): AllowShape<this, number>;

  /**
   * Replaces an input `NaN` value with a default output value.
   *
   * @param defaultValue The value that is used instead of `NaN` in the output.
   */
  nan<T extends Any>(defaultValue: T): ReplaceShape<this, number, T>;

  nan(defaultValue?: any) {
    return this.replace(NaN, arguments.length === 0 ? NaN : defaultValue);
  }

  protected _getInputs(): readonly unknown[] {
    return this.isCoercing ? numberCoercibleInputs : numberInputs;
  }

  protected _apply(input: any, options: ParseOptions, _nonce: number): Result<number> {
    let output = input;

    if ((typeof output !== 'number' || output !== output) && (output = this._applyCoerce(input)) === NEVER) {
      return [createIssue(CODE_TYPE_NUMBER, input, MESSAGE_TYPE_NUMBER, undefined, options, this._options)];
    }
    return this._applyOperations(input, output, options, null) as Result;
  }
}

NumberShape.prototype['_coerce'] = coerceToNumber;
