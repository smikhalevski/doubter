import { ValueType } from './Shape';
import { ApplyResult, Issue, Message, ParseOptions, ReadonlyDict, TypeConstraintOptions } from '../shared-types';
import { createIssueFactory, getValueType, isArray, ok } from '../utils';
import { CODE_ENUM, MESSAGE_ENUM } from '../constants';
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
    return this.values.map(getValueType);
  }

  protected _apply(input: any, options: ParseOptions): ApplyResult<T> {
    const { _applyChecks } = this;

    if (!this.values.includes(input)) {
      if (options.coerced || this._coerced) {
        return this._applyToCoerced(input, options);
      }
      return this._issueFactory(input, options);
    }
    if (_applyChecks !== null) {
      return _applyChecks(input, null, options);
    }
    return null;
  }

  private _applyToCoerced(input: any, options: ParseOptions): ApplyResult<T> {
    const { _valueMapping, _applyChecks } = this;

    let output;
    let issues: Issue[] | null = null;

    if (_valueMapping === null || !_valueMapping.hasOwnProperty(input)) {
      return this._issueFactory(input, options);
    }

    output = _valueMapping[input];

    if (_applyChecks !== null) {
      issues = _applyChecks(output, null, options);

      if (issues !== null) {
        return issues;
      }
    }
    return ok(output);
  }
}
