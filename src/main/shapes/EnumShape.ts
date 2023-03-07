import { CODE_ENUM, MESSAGE_ENUM, TYPE_ARRAY, TYPE_OBJECT, TYPE_STRING } from '../constants';
import { ApplyOptions, ConstraintOptions, Message } from '../types';
import { canonize, createIssueFactory, getValueType, isArray, ok, ReadonlyDict, toUniqueArray } from '../utils';
import { CoercibleShape } from './CoercibleShape';
import { NEVER, Result, Type } from './Shape';

/**
 * The shape that constrains an input to one of values.
 *
 * @template T Allowed values.
 */
export class EnumShape<T> extends CoercibleShape<T> {
  /**
   * The array of unique values allowed as an input.
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
   * @param source The array of allowed values, a const key-value mapping, or an enum object.
   * @param options The type constraint options or an issue message.
   * @template T Allowed values.
   */
  constructor(
    /**
     * The array of allowed values, a const key-value mapping, or an enum object.
     */
    readonly source: readonly T[] | ReadonlyDict<T>,
    options?: ConstraintOptions | Message
  ) {
    super();

    let valueMapping: ReadonlyDict | null;
    let values: any[];

    if (isArray(source)) {
      valueMapping = null;
      values = toUniqueArray(source);
    } else {
      valueMapping = source;
      values = getUniqueEnumValues(source);
    }

    this.values = values;

    this._valueMapping = valueMapping;
    this._typeIssueFactory = createIssueFactory(CODE_ENUM, MESSAGE_ENUM, options, values);
  }

  protected _getInputTypes(): readonly Type[] {
    const valueTypes = this.values.map(getValueType);

    if (!this.isCoerced) {
      return valueTypes;
    }

    if (this._valueMapping !== null) {
      valueTypes.push(TYPE_STRING);
    }
    valueTypes.push(TYPE_ARRAY, TYPE_OBJECT);

    return valueTypes;
  }

  protected _getInputValues(): readonly unknown[] | null {
    return this.values;
  }

  protected _apply(input: any, options: ApplyOptions): Result<T> {
    const { _applyChecks } = this;

    let output = input;
    let issues = null;
    let changed = false;

    if (
      !this.values.includes(output) &&
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
   * Coerces a value to an enum value or returns {@linkcode NEVER} if coercion isn't possible.
   *
   * @param value The non-enum value to coerce.
   */
  protected _coerce(value: any): unknown {
    const { _valueMapping } = this;

    if (isArray(value) && value.length === 1 && this.values.includes((value = value[0]))) {
      return value;
    }

    value = canonize(value);

    if (_valueMapping !== null && typeof value === 'string' && value in _valueMapping) {
      return _valueMapping[value];
    }
    return NEVER;
  }
}

/**
 * Returns unique values of the enum. Source must contain key-value and value-key mapping to be considered a native
 * enum.
 */
export function getUniqueEnumValues(source: ReadonlyDict): any[] {
  const values: number[] = [];

  for (const key in source) {
    const a = source[key];
    const b = source[a];

    const aType = typeof a;
    const bType = typeof b;

    if (((aType !== 'string' || bType !== 'number') && (aType !== 'number' || bType !== 'string')) || b != key) {
      return toUniqueArray(Object.values(source));
    }
    if (typeof a === 'number' && !values.includes(a)) {
      values.push(a);
    }
  }
  return values;
}
