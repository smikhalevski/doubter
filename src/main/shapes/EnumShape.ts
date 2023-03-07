import { CODE_ENUM, MESSAGE_ENUM, TYPE_ARRAY, TYPE_NEVER, TYPE_OBJECT, TYPE_STRING } from '../constants';
import { ApplyOptions, ConstraintOptions, Message } from '../types';
import { canonize, createIssueFactory, getValueType, isArray, ok, ReadonlyDict } from '../utils';
import { CoercibleShape } from './CoercibleShape';
import { NEVER, Result, Type } from './Shape';

/**
 * The shape that constrains an input to be one of values.
 *
 * @template T Allowed values.
 */
export class EnumShape<T> extends CoercibleShape<T> {
  /**
   * The array of unique enum values.
   */
  declare inputValues: readonly unknown[];

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

    this._typeIssueFactory = createIssueFactory(CODE_ENUM, MESSAGE_ENUM, options);
  }

  protected _getInputTypes(): readonly Type[] {
    const types = this._getInputValues().map(getValueType);

    if (types.length === 0) {
      return [TYPE_NEVER];
    }
    if (!this.isCoerced) {
      return types;
    }
    if (!isArray(this.source)) {
      types.push(TYPE_STRING);
    }
    return types.concat(TYPE_ARRAY, TYPE_OBJECT);
  }

  protected _getInputValues(): readonly unknown[] {
    return isArray(this.source) ? this.source : getEnumValues(this.source);
  }

  protected _apply(input: any, options: ApplyOptions): Result<T> {
    const { inputValues, _applyChecks } = this;

    let output = input;
    let issues = null;
    let changed = false;

    if (
      !inputValues.includes(output) &&
      (!(changed = options.coerced || this.isCoerced) || (output = this._coerce(input)) === NEVER)
    ) {
      return this._typeIssueFactory(input, options, inputValues);
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
    const { source } = this;

    if (isArray(value) && value.length === 1 && this.inputValues.includes((value = value[0]))) {
      return value;
    }
    if (!isArray(source) && typeof (value = canonize(value)) === 'string' && source.hasOwnProperty(value)) {
      return (source as ReadonlyDict)[value];
    }
    return NEVER;
  }
}

/**
 * Returns unique values of the enum. Source must contain key-value and value-key mapping to be considered a native
 * enum.
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
