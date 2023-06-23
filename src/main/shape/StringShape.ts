import { CODE_TYPE, MESSAGE_STRING_TYPE } from '../constants';
import { getCanonicalValueOf, isArray, isValidDate, ok } from '../internal';
import { TYPE_ARRAY, TYPE_BIGINT, TYPE_BOOLEAN, TYPE_NUMBER, TYPE_OBJECT, TYPE_STRING } from '../Type';
import {
  AlterCallback,
  AlterOptions,
  ApplyOptions,
  ConstraintOptions,
  Message,
  RefineCallback,
  RefineOptions,
  RefinePredicate,
  Result,
} from '../types';
import { createIssueFactory } from '../utils';
import { CoercibleShape } from './CoercibleShape';
import { NEVER } from './Shape';

/**
 * The shape of a string value.
 *
 * @template InputValue
 * @template OutputValue
 * @group Shapes
 */
export class StringShape<
  InputValue extends string = string,
  OutputValue extends InputValue = InputValue
> extends CoercibleShape<InputValue, OutputValue, string> {
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

  protected _apply(input: any, options: ApplyOptions, nonce: number): Result<OutputValue> {
    const { _applyOperations } = this;

    let output = input;
    let changed = false;

    if (
      typeof output !== 'string' &&
      (!(changed = options.coerce || this.isCoercing) || (output = this._coerce(input)) === NEVER)
    ) {
      return [this._typeIssueFactory(input, options)];
    }
    if (_applyOperations !== null) {
      return _applyOperations(output, options, changed, null, null);
    }
    if (changed) {
      return ok(output);
    }
    return null;
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

export interface StringShape<InputValue, OutputValue> {
  alter<AlteredOutputValue extends OutputValue, Param>(
    cb: AlterCallback<OutputValue, AlteredOutputValue, Param>,
    options: AlterOptions & { param: Param }
  ): StringShape<InputValue, AlteredOutputValue>;

  alter<AlteredOutputValue extends OutputValue>(
    cb: AlterCallback<OutputValue, AlteredOutputValue>,
    options?: AlterOptions
  ): StringShape<InputValue, AlteredOutputValue>;

  refine<RefinedOutputValue extends OutputValue>(
    cb: RefinePredicate<OutputValue, RefinedOutputValue>,
    options?: RefineOptions | Message
  ): StringShape<InputValue, RefinedOutputValue>;

  refine(cb: RefineCallback<OutputValue>, options?: RefineOptions | Message): this;
}
