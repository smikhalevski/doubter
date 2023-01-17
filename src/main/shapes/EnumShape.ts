import { ValueType } from './Shape';
import { ApplyResult, Issue, Message, ParseOptions, ReadonlyDict, TypeConstraintOptions } from '../shared-types';
import { createIssueFactory, getValueType, isArray, ok, unique } from '../utils';
import { CODE_ENUM, MESSAGE_ENUM, TYPE_ARRAY, TYPE_STRING } from '../constants';
import { CoercibleShape } from './CoercibleShape';

/**
 * The shape that constrains an input to one of values.
 *
 * @template T Allowed values.
 */
export class EnumShape<T> extends CoercibleShape<T> {
  /**
   * The list of values allowed for the input.
   */
  readonly values: readonly T[];

  /**
   * Key-value mapping passes as a source to constructor, or `null` if the source was a list of values.
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
    options?: TypeConstraintOptions | Message
  ) {
    super();

    let valueMapping: ReadonlyDict | null;
    let values: any[];

    if (isArray(source)) {
      valueMapping = null;
      values = unique(source);
    } else {
      valueMapping = source;
      values = unique(getValues(source));
    }

    this.values = values;

    this._valueMapping = valueMapping;
    this._typeIssueFactory = createIssueFactory(CODE_ENUM, MESSAGE_ENUM, options, values);
  }

  protected _getInputTypes(): ValueType[] {
    const valueTypes = this.values.map(getValueType);

    if (this._coerced) {
      return valueTypes.concat(TYPE_STRING, TYPE_ARRAY);
    } else {
      return valueTypes;
    }
  }

  protected _getInputValues(): unknown[] {
    return this.values.slice(0);
  }

  protected _apply(input: any, options: ParseOptions): ApplyResult<T> {
    const { _applyChecks } = this;

    const output = options.coerced || this._coerced ? this._coerce(input) : input;

    let issues: Issue[] | null = null;

    if (!this.values.includes(output)) {
      return this._typeIssueFactory(input, options);
    }
    if (_applyChecks !== null) {
      issues = _applyChecks(output, null, options);
    }
    if (issues === null && input !== output) {
      return ok(output);
    }
    return issues;
  }

  protected _coerce(input: any): unknown {
    const { _valueMapping } = this;

    if (_valueMapping === null || this.values.includes(input)) {
      return input;
    }
    if (typeof input === 'string' && input in _valueMapping) {
      return _valueMapping[input];
    }
    if (isArray(input) && input.length === 1) {
      return this._coerce(input[0]);
    }
    return input;
  }
}

/**
 * Returns values of the enum. Source must contain key-value and value-key mapping to be considered a native enum.
 */
export function getValues(source: ReadonlyDict): any[] {
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
