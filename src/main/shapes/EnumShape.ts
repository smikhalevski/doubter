import { CODE_ENUM, MESSAGE_ENUM } from '../constants';
import { TYPE_ARRAY, TYPE_OBJECT } from '../Type';
import { ApplyOptions, ConstraintOptions, Message } from '../types';
import { getCanonicalValueOf, createIssueFactory, isArray, ok, ReadonlyDict, unique } from '../utils';
import { CoercibleShape } from './CoercibleShape';
import { NEVER, Result } from './Shape';

/**
 * The shape that constrains an input to be one of values.
 *
 * @template T Allowed values.
 */
export class EnumShape<T> extends CoercibleShape<T> {
  /**
   * The array of unique enum values.
   */
  readonly values: T[];

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

    this.values = (isArray(source) ? source : getEnumValues(source)).filter(unique);

    this._typeIssueFactory = createIssueFactory(CODE_ENUM, MESSAGE_ENUM, options, this.values);
  }

  protected _getInputs(): unknown[] {
    const inputs: unknown[] = this.values.slice(0);

    if (!this.isCoerced || inputs.length === 0) {
      return inputs;
    }
    if (!isArray(this.source)) {
      inputs.push(...Object.keys(this.source));
    }
    return inputs.concat(TYPE_ARRAY, TYPE_OBJECT);
  }

  protected _apply(input: any, options: ApplyOptions): Result<T> {
    const { values, _applyChecks } = this;

    let output = input;
    let issues = null;
    let changed = false;

    if (
      !values.includes(output) &&
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
    const { source } = this;

    if (isArray(value) && value.length === 1 && this.values.includes((value = value[0]))) {
      return value;
    }
    if (!isArray(source) && typeof (value = getCanonicalValueOf(value)) === 'string' && source.hasOwnProperty(value)) {
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
