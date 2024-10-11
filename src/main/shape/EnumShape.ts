import { coerceToConst, getConstCoercibleInputs } from '../coerce/const';
import { NEVER } from '../coerce/never';
import { CODE_TYPE_ENUM, MESSAGE_TYPE_ENUM } from '../constants';
import { unique } from '../internal/arrays';
import { getCanonicalValue, isArray } from '../internal/lang';
import { ReadonlyDict } from '../internal/objects';
import { Type } from '../Type';
import { IssueOptions, Message, ParseOptions, Result } from '../types';
import { createIssue } from '../utils';
import { CoercibleShape } from './CoercibleShape';

/**
 * The shape of a value enumeration.
 *
 * @template Value The union of allowed enum values.
 * @group Shapes
 */
export class EnumShape<Value> extends CoercibleShape<Value> {
  /**
   * The array of unique enum values.
   */
  readonly values: readonly Value[];

  /**
   * The type issue options or the type issue message.
   */
  protected _options;

  protected _coerce = coerceToEnum;

  /**
   * Creates a new {@link EnumShape} instance.
   *
   * @param source The array of allowed values, a const key-value mapping, or an enum object.
   * @param options The issue options or the issue message.
   * @template Value The union of allowed enum values.
   */
  constructor(
    /**
     * The array of allowed values, a const key-value mapping, or an TypeScript enum object.
     */
    readonly source: readonly Value[] | ReadonlyDict<Value>,
    options?: IssueOptions | Message
  ) {
    super();

    this.values = getEnumValues(source);

    this._options = options;
  }

  protected _getInputs(): readonly unknown[] {
    const inputs: unknown[] = this.values.slice(0);

    if (!this.isCoercing || inputs.length === 0) {
      return inputs;
    }
    if (!isArray(this.source)) {
      inputs.push(...Object.keys(this.source));
    }
    for (const value of this.values) {
      inputs.push(...getConstCoercibleInputs(value));
    }
    return unique(inputs.concat(Type.ARRAY));
  }

  protected _apply(input: any, options: ParseOptions, _nonce: number): Result<Value> {
    let output = input;

    if (!this.values.includes(output) && (output = this._applyCoerce(input)) === NEVER) {
      return [createIssue(CODE_TYPE_ENUM, input, MESSAGE_TYPE_ENUM, this.values, options, this._options)];
    }
    return this._applyOperations(input, output, options, null) as Result;
  }
}

/**
 * Returns unique values of the enum. Source must contain key-value and value-key mapping to be considered a native
 * enum.
 */
export function getEnumValues(source: ReadonlyDict): any[] {
  if (isArray(source)) {
    return unique(source);
  }

  const values: number[] = [];

  for (const key in source) {
    const a = source[key];
    const b = source[a];

    const aType = typeof a;
    const bType = typeof b;

    if (((aType !== 'string' || bType !== 'number') && (aType !== 'number' || bType !== 'string')) || b != key) {
      return unique(Object.values(source));
    }
    if (typeof a === 'number' && values.indexOf(a) === -1) {
      values.push(a);
    }
  }
  return values;
}

function coerceToEnum<Value>(this: EnumShape<Value>, input: unknown): Value {
  const { source, values } = this;

  if (isArray(input) && input.length === 1 && values.includes((input = input[0]))) {
    return input as Value;
  }
  if (!isArray(source) && typeof (input = getCanonicalValue(input)) === 'string' && source.hasOwnProperty(input)) {
    return (source as ReadonlyDict)[input];
  }

  for (const value of values) {
    if (coerceToConst(value, input) !== NEVER) {
      return value;
    }
  }
  return NEVER;
}
