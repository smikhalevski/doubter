import { NEVER } from '../coerce/never';
import { coerceToString, stringCoercibleTypes } from '../coerce/string';
import { CODE_TYPE } from '../constants';
import { stringTypes, TYPE_STRING, TypeArray } from '../Type';
import { ApplyOptions, IssueOptions, Message, Result } from '../typings';
import { createIssueFactory } from '../utils';
import { CoercibleShape } from './CoercibleShape';
import { Shape } from './Shape';

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

    this._typeIssueFactory = createIssueFactory(CODE_TYPE, Shape.messages['type.string'], options, TYPE_STRING);
  }

  protected _getInputs(): TypeArray {
    return stringTypes;
  }

  protected _getCoercibleInputs(): TypeArray {
    return stringCoercibleTypes;
  }

  protected _apply(input: any, options: ApplyOptions, nonce: number): Result<string> {
    let output = input;

    if (typeof output !== 'string' && (output = this._tryCoerce(input, options.coerce)) === NEVER) {
      return [this._typeIssueFactory(input, options)];
    }
    return this._applyOperations(input, output, options, null);
  }
}

StringShape.prototype['_coerce'] = coerceToString;
