import { ValueType } from './Shape';
import { ApplyResult, Issue, Message, ParseOptions, ReadonlyDict, TypeConstraintOptions } from '../shared-types';
import { createIssueFactory, getValueType, isArray, ok } from '../utils';
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

  protected _valueMapping: ReadonlyDict<T> | null;
  protected _issueFactory;

  /**
   * Creates a new {@linkcode EnumShape} instance.
   *
   * @param source The list of allowed values, a const key-value mapping, or an enum object.
   * @param options The type constraint options or an issue message.
   * @template T Allowed values.
   */
  constructor(source: readonly T[] | ReadonlyDict<T>, options?: TypeConstraintOptions | Message) {
    super();

    let valueMapping: ReadonlyDict | null;
    let values: any[];

    if (isArray(source)) {
      valueMapping = null;
      values = source;
    } else {
      valueMapping = source;
      values = Object.values(valueMapping).filter(value => typeof valueMapping![value] !== 'number');
    }

    // Ensure uniqueness
    this.values = values.filter((value, i) => !values.includes(value, i + 1));

    this._valueMapping = valueMapping;
    this._issueFactory = createIssueFactory(CODE_ENUM, MESSAGE_ENUM, options, values);
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

    const coerced = options.coerced || this._coerced;
    const output = coerced ? this._coerce(input) : input;

    let issues: Issue[] | null = null;

    if (!this.values.includes(output)) {
      return this._issueFactory(input, options);
    }
    if (_applyChecks !== null) {
      issues = _applyChecks(output, null, options);
    }
    if (coerced && issues === null && input !== output) {
      return ok(output);
    }
    return issues;
  }

  protected _coerce(input: any): unknown {
    const { _valueMapping } = this;

    if (_valueMapping === null || this.values.includes(input)) {
      return input;
    }
    if (_valueMapping.hasOwnProperty(input)) {
      return _valueMapping[input];
    }
    if (isArray(input) && input.length === 1) {
      return this._coerce(input[0]);
    }
    return input;
  }
}
