import { ApplyResult, ValueType } from './Shape';
import { ConstraintOptions, Message, ParseOptions } from '../shared-types';
import { createIssueFactory, getValueType, isArray, ok, ReadonlyDict, unique } from '../utils';
import { CODE_ENUM, MESSAGE_ENUM, TYPE_ARRAY, TYPE_STRING } from '../constants';
import { CoercibleShape } from './CoercibleShape';

export const UNRECOGNIZED = Symbol();

/**
 * The shape that constrains an input to one of values.
 *
 * @template T Allowed values.
 */
export class EnumShape<T> extends CoercibleShape<T> {
  /**
   * The list of unique values allowed as an input.
   */
  readonly values: readonly T[];

  /**
   * The key-value mapping that was passed as a source arguments to the constructor, or `null` if the source was an
   * array of values.
   */
  protected _valueMapping: ReadonlyDict<T> | null;
  protected _typeIssueFactory;

  /**
   * Creates a new {@linkcode EnumShape} instance.
   *
   * @param source The list of allowed values, a const key-value mapping, or an enum object.
   * @param options The type constraint options or an issue message.
   * @template T Allowed values.
   */
  constructor(
    /**
     * The list of allowed values, a const key-value mapping, or an enum object.
     */
    readonly source: readonly T[] | ReadonlyDict<T>,
    options?: ConstraintOptions | Message
  ) {
    super();

    let valueMapping: ReadonlyDict | null;
    let values: any[];

    if (isArray(source)) {
      valueMapping = null;
      values = unique(source).slice(0);
    } else {
      valueMapping = source;
      values = unique(getEnumValues(source));
    }

    this.values = values;

    this._valueMapping = valueMapping;
    this._typeIssueFactory = createIssueFactory(CODE_ENUM, MESSAGE_ENUM, options, values);
  }

  protected _getInputTypes(): readonly ValueType[] {
    const valueTypes = this.values.map(getValueType);

    if (!this.isCoerced) {
      return valueTypes;
    }

    if (this._valueMapping !== null) {
      valueTypes.push(TYPE_STRING);
    }
    valueTypes.push(TYPE_ARRAY);

    return valueTypes;
  }

  protected _getInputValues(): unknown[] {
    return this.values.slice(0);
  }

  protected _apply(input: any, options: ParseOptions): ApplyResult<T> {
    const { _applyChecks } = this;

    let output = input;
    let issues = null;
    let changed = false;

    if (
      !this.values.includes(output) &&
      (!(changed = options.coerced || this.isCoerced) || (output = this._coerce(input)) === UNRECOGNIZED)
    ) {
      return this._typeIssueFactory(input, options);
    }
    if ((_applyChecks === null || (issues = _applyChecks(output, null, options)) === null) && changed) {
      return ok(output);
    }
    return issues;
  }

  /**
   * Coerces value to an enum value or returns {@linkcode UNRECOGNIZED} if coercion isn't possible.
   *
   * @param value The non-enum value to coerce.
   */
  protected _coerce(value: any): unknown {
    const { _valueMapping } = this;

    if (isArray(value) && value.length === 1 && this.values.includes((value = value[0]))) {
      return value;
    }
    if (_valueMapping !== null && typeof value === 'string' && value in _valueMapping) {
      return _valueMapping[value];
    }
    return UNRECOGNIZED;
  }
}

/**
 * Returns values of the enum. Source must contain key-value and value-key mapping to be considered a native enum.
 */
export function getEnumValues(source: ReadonlyDict): any[] {
  const values: number[] = [];

  for (const key in source) {
    const a = source[key];
    const b = source[a];

    const aType = typeof a;
    const bType = typeof b;

    if (((aType !== 'string' || bType !== 'number') && (aType !== 'number' || bType !== 'string')) || b != key) {
      return Object.values(source);
    }
    if (typeof a === 'number') {
      values.push(a);
    }
  }
  return values;
}
