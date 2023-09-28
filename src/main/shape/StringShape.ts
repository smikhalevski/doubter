import { coerceToString } from '../coerce/coerceToString';
import { NEVER } from '../coerce/NEVER';
import { CODE_TYPE } from '../constants';
import { TYPE_ARRAY, TYPE_BIGINT, TYPE_BOOLEAN, TYPE_DATE, TYPE_NUMBER, TYPE_OBJECT, TYPE_STRING } from '../Type';
import { ApplyOptions, IssueOptions, Message, Result } from '../types';
import { createIssueFactory } from '../utils';
import { CoercibleShape } from './CoercibleShape';

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

  protected _getInputs(): unknown[] {
    if (this.isCoercing) {
      return [TYPE_ARRAY, TYPE_OBJECT, TYPE_STRING, TYPE_NUMBER, TYPE_BOOLEAN, TYPE_BIGINT, TYPE_DATE, null, undefined];
    } else {
      return [TYPE_STRING];
    }
  }

  protected _apply(input: any, options: ApplyOptions, nonce: number): Result<string> {
    let output = input;

    if (typeof output !== 'string' && (output = this._applyCoercion(input, options.coerce)) === NEVER) {
      return [this._typeIssueFactory(input, options)];
    }
    return this._applyOperations(input, output, options, null);
  }
}

StringShape.prototype['_coerce'] = coerceToString;
