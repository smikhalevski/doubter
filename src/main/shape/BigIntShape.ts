import { bigintCoercibleTypes, coerceToBigInt } from '../coerce/bigint';
import { NEVER } from '../coerce/never';
import { CODE_TYPE } from '../constants';
import { TYPE_BIGINT, TypeArray } from '../Type';
import { ApplyOptions, IssueOptions, Message, Result } from '../typings';
import { createIssueFactory } from '../utils';
import { CoercibleShape } from './CoercibleShape';
import { Shape } from './Shape';

/**
 * The shape of a bigint value.
 *
 * @group Shapes
 */
export class BigIntShape extends CoercibleShape<bigint> {
  /**
   * Returns issues associated with an invalid input value type.
   */
  protected _typeIssueFactory;

  /**
   * Creates a new {@link BigIntShape} instance.
   *
   * @param options The issue options or the issue message.
   */
  constructor(options?: IssueOptions | Message) {
    super();

    this._typeIssueFactory = createIssueFactory(CODE_TYPE, Shape.messages['type.bigint'], options, TYPE_BIGINT);
  }

  protected _getInputs(): TypeArray {
    return [TYPE_BIGINT];
  }

  protected _getCoercibleInputs(): TypeArray {
    return bigintCoercibleTypes;
  }

  protected _apply(input: any, options: ApplyOptions, nonce: number): Result<bigint> {
    let output = input;

    if (typeof output !== 'bigint' && (output = this._tryCoerce(input, options.coerce)) === NEVER) {
      return [this._typeIssueFactory(input, options)];
    }
    return this._applyOperations(input, output, options, null);
  }
}

BigIntShape.prototype['_coerce'] = coerceToBigInt;
