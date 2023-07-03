import { CODE_TYPE, MESSAGE_STRING_TYPE } from '../constants';
import { getCanonicalValueOf, isArray, isValidDate } from '../internal';
import { TYPE_ARRAY, TYPE_BIGINT, TYPE_BOOLEAN, TYPE_NUMBER, TYPE_OBJECT, TYPE_STRING } from '../Type';
import {
  AlterCallback,
  AlterOptions,
  ApplyOptions,
  ConstraintOptions,
  Message,
  ParameterizedAlterOptions,
  ParameterizedRefineOptions,
  RefineCallback,
  RefineOptions,
  RefinePredicate,
  Result,
} from '../types';
import { createIssueFactory } from '../utils';
import { CoercibleShape } from './CoercibleShape';
import { NEVER, Shape } from './Shape';

/**
 * The shape of a string value.
 *
 * @template Value The output value.
 * @group Shapes
 */
export class StringShape<Value extends string = string> extends CoercibleShape<string, Value, string> {
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
    let output = input;

    if (
      typeof output !== 'string' &&
      (!(options.coerce || this.isCoercing) || (output = this._coerce(input)) === NEVER)
    ) {
      return [this._typeIssueFactory(input, options)];
    }
    return this._applyOperations(input, output, options, null);
  }

  /**
   * Coerces a value to a string.
   *
   * @param value The non-string value to coerce.
   * @returns A string value, or {@linkcode NEVER} if coercion isn't possible.
   */
  protected _coerce(value: unknown): string {
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

export interface StringShape<Value> extends Shape<string, Value> {
  refine<RefinedValue extends Value, Param>(
    cb: RefinePredicate<Value, RefinedValue, Param>,
    options: ParameterizedRefineOptions<Param> | Message
  ): StringShape<RefinedValue>;

  refine<RefinedValue extends Value>(
    cb: RefinePredicate<Value, RefinedValue>,
    options?: RefineOptions | Message
  ): StringShape<RefinedValue>;

  refine<Param>(cb: RefineCallback<Value, Param>, options?: ParameterizedRefineOptions<Param> | Message): this;

  refine(cb: RefineCallback<Value>, options?: RefineOptions | Message): this;

  alter<AlteredValue extends Value, Param>(
    cb: AlterCallback<Value, AlteredValue, Param>,
    options: ParameterizedAlterOptions<Param>
  ): StringShape<AlteredValue>;

  alter<AlteredValue extends Value>(
    cb: AlterCallback<Value, AlteredValue>,
    options?: AlterOptions
  ): StringShape<AlteredValue>;

  alter<Param>(cb: AlterCallback<Value, Value, Param>, options: ParameterizedAlterOptions<Param>): this;

  alter(cb: AlterCallback<Value>, options?: AlterOptions): this;
}
