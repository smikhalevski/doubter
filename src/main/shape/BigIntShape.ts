import { CODE_TYPE, MESSAGE_BIGINT_TYPE } from '../constants';
import { getCanonicalValueOf, isArray } from '../internal';
import { TYPE_ARRAY, TYPE_BIGINT, TYPE_BOOLEAN, TYPE_NUMBER, TYPE_OBJECT, TYPE_STRING } from '../Type';
import { ApplyOptions, IssueOptions, Message, Result } from '../types';
import { createIssueFactory } from '../utils';
import { CoercibleShape } from './CoercibleShape';
import { NEVER } from './Shape';

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
   * Creates a new {@linkcode BigIntShape} instance.
   *
   * @param options The issue options or the issue message.
   */
  constructor(options?: IssueOptions | Message) {
    super();

    this._typeIssueFactory = createIssueFactory(CODE_TYPE, MESSAGE_BIGINT_TYPE, options, TYPE_BIGINT);
  }

  protected _getInputs(): unknown[] {
    if (this.isCoercing) {
      return [TYPE_BIGINT, TYPE_OBJECT, TYPE_STRING, TYPE_NUMBER, TYPE_BOOLEAN, TYPE_ARRAY, null, undefined];
    } else {
      return [TYPE_BIGINT];
    }
  }

  protected _apply(input: any, options: ApplyOptions, nonce: number): Result<bigint> {
    let output = input;

    if (
      typeof output !== 'bigint' &&
      (!(options.coerce || this.isCoercing) || (output = this._coerce(input)) === NEVER)
    ) {
      return [this._typeIssueFactory(input, options)];
    }
    return this._applyOperations(input, output, options, null);
  }

  /**
   * Coerces a value to a bigint.
   *
   * @param value The non-bigint value to coerce.
   * @returns A bigint value, or {@linkcode NEVER} if coercion isn't possible.
   */
  protected _coerce(value: any): bigint {
    if (isArray(value) && value.length === 1 && typeof (value = value[0]) === 'bigint') {
      return value;
    }
    if (value === null || value === undefined) {
      return BigInt(0);
    }

    value = getCanonicalValueOf(value);

    if (typeof value === 'number' || typeof value === 'string' || typeof value === 'boolean') {
      try {
        return BigInt(value);
      } catch {}
    }
    return NEVER;
  }
}
