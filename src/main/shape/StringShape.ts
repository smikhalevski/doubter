import { CODE_TYPE, MESSAGE_STRING_TYPE } from '../constants';
import {
  AlterCallback,
  AlterOptions,
  getCanonicalValueOf,
  isArray,
  isValidDate,
  RefineCallback,
  RefinePredicate,
} from '../internal';
import { TYPE_ARRAY, TYPE_BIGINT, TYPE_BOOLEAN, TYPE_NUMBER, TYPE_OBJECT, TYPE_STRING } from '../Type';
import { ApplyOptions, ConstraintOptions, Message, RefineOptions } from '../types';
import { createIssueFactory } from '../utils';
import { CoercibleShape } from './CoercibleShape';
import { NEVER, Result } from './Shape';

export interface StringShape<Value> {
  alter<Param, RefinedValue extends Value>(
    cb: AlterCallback<Value, RefinedValue, Param>,
    options: AlterOptions & { param: Param }
  ): StringShape<RefinedValue>;

  alter<RefinedValue extends Value>(cb: AlterCallback<Value, RefinedValue>): StringShape<RefinedValue>;

  refine<RefinedValue extends Value>(
    cb: RefinePredicate<Value, RefinedValue>,
    options?: RefineOptions | Message
  ): StringShape<RefinedValue>;

  refine(cb: RefineCallback<Value>, options?: RefineOptions | Message): this;
}

/**
 * The shape of a string value.
 *
 * @group Shapes
 */
export class StringShape<Value extends string = string> extends CoercibleShape<Value, Value, string> {
  /**
   * Returns issues associated with an invalid input value type.
   */
  protected _typeIssueFactory;

  /**
   * Creates a new {@linkcode StringShape} instance.
   *
   * @param options The type constraint options or the type issue message.
   */
  constructor(options?: ConstraintOptions | Message) {
    super();

    this._typeIssueFactory = createIssueFactory(CODE_TYPE, MESSAGE_STRING_TYPE, options, TYPE_STRING);
  }

  protected _getInputs(): unknown[] {
    if (this.isCoercing) {
      return [TYPE_STRING, TYPE_OBJECT, TYPE_NUMBER, TYPE_BOOLEAN, TYPE_BIGINT, TYPE_ARRAY, null, undefined];
    } else {
      return [TYPE_STRING];
    }
  }

  protected _apply(input: any, options: ApplyOptions, nonce: number): Result<Value> {
    const { _processor } = this;

    let output = input;
    let issues = null;
    let changed = false;

    if (
      typeof output !== 'string' &&
      (!(changed = options.coerce || this.isCoercing) || (output = this._coerce(input)) === NEVER)
    ) {
      return [this._typeIssueFactory(input, options)];
    }
    if (_processor !== null) {
      return _processor(output, issues, options, changed);
    }
    return issues;
  }

  /**
   * Coerces a value to a string.
   *
   * @param value The non-string value to coerce.
   * @returns A string value, or {@linkcode NEVER} if coercion isn't possible.
   */
  protected _coerce(value: any): string {
    if (isArray(value) && value.length === 1 && typeof (value = value[0]) === 'string') {
      return value;
    }
    if (value === null || value === undefined) {
      return '';
    }

    value = getCanonicalValueOf(value);

    if (typeof value === 'string') {
      return value;
    }
    if (Number.isFinite(value) || typeof value === 'boolean' || typeof value === 'bigint') {
      return '' + value;
    }
    if (isValidDate(value)) {
      return value.toISOString();
    }
    return NEVER;
  }
}
