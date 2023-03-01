import { NEVER, Result, ValueType } from './Shape';
import { ConstraintOptions, Message, ParseOptions } from '../shared-types';
import { createIssueFactory, isArray, ok, toPrimitive } from '../utils';
import {
  CODE_TYPE,
  MESSAGE_BIGINT_TYPE,
  TYPE_ARRAY,
  TYPE_BIGINT,
  TYPE_BOOLEAN,
  TYPE_NULL,
  TYPE_NUMBER,
  TYPE_STRING,
  TYPE_UNDEFINED,
} from '../constants';
import { CoercibleShape } from './CoercibleShape';

/**
 * The shape of the bigint value.
 */
export class BigIntShape extends CoercibleShape<bigint> {
  protected _typeIssueFactory;

  /**
   * Creates a new {@linkcode BigIntShape} instance.
   *
   * @param options The type constraint options or the type issue message.
   */
  constructor(options?: ConstraintOptions | Message) {
    super();

    this._typeIssueFactory = createIssueFactory(CODE_TYPE, MESSAGE_BIGINT_TYPE, options, TYPE_BIGINT);
  }

  protected _getInputTypes(): readonly ValueType[] {
    if (this.isCoerced) {
      return [TYPE_BIGINT, TYPE_STRING, TYPE_NUMBER, TYPE_BOOLEAN, TYPE_ARRAY, TYPE_UNDEFINED, TYPE_NULL];
    } else {
      return [TYPE_BIGINT];
    }
  }

  protected _apply(input: any, options: ParseOptions): Result<bigint> {
    const { _applyChecks } = this;

    let output = input;
    let issues = null;
    let changed = false;

    if (
      typeof output !== 'bigint' &&
      (!(changed = options.coerced || this.isCoerced) || (output = this._coerce(input)) === NEVER)
    ) {
      return this._typeIssueFactory(input, options);
    }
    if ((_applyChecks === null || (issues = _applyChecks(output, null, options)) === null) && changed) {
      return ok(output);
    }
    return issues;
  }

  /**
   * Coerces a value to a bigint or returns {@linkcode NEVER} if coercion isn't possible.
   *
   * @param value The non-bigint value to coerce.
   */
  protected _coerce(value: any): bigint {
    if (isArray(value) && value.length === 1 && typeof (value = value[0]) === 'bigint') {
      return value;
    }
    if (value === null || value === undefined) {
      return BigInt(0);
    }

    value = toPrimitive(value);

    if (typeof value === 'number' || typeof value === 'string' || typeof value === 'boolean') {
      try {
        return BigInt(value);
      } catch {}
    }
    return NEVER;
  }
}
