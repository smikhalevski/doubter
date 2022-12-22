import { ValueType } from './Shape';
import { ApplyResult, ConstraintOptions, Issue, Message, ParseOptions, TypeConstraintOptions } from '../shared-types';
import { appendCheck, coercibleTypes, createIssueFactory, isArray, ok, stringTypes } from '../utils';
import {
  CODE_STRING_MAX,
  CODE_STRING_MIN,
  CODE_STRING_REGEX,
  CODE_TYPE,
  MESSAGE_STRING_MAX,
  MESSAGE_STRING_MIN,
  MESSAGE_STRING_REGEX,
  MESSAGE_STRING_TYPE,
  TYPE_STRING,
} from '../constants';
import { CoercibleShape } from './CoercibleShape';

/**
 * The shape that constrains the input as a string.
 */
export class StringShape extends CoercibleShape<string> {
  protected _issueFactory;

  /**
   * Creates a new {@linkcode StringShape} instance.
   *
   * @param options The type constraint options or the type issue message.
   */
  constructor(options?: TypeConstraintOptions | Message) {
    super();

    this._issueFactory = createIssueFactory(CODE_TYPE, MESSAGE_STRING_TYPE, options, TYPE_STRING);
  }

  /**
   * The shortcut to apply both {@linkcode min} and {@linkcode max} constraints.
   *
   * @param length The exact length a string must have.
   * @param options The constraint options or an issue message.
   * @returns The clone of the shape.
   */
  length(length: number, options?: ConstraintOptions | Message): this {
    return this.min(length, options).max(length, options);
  }

  /**
   * Constrains the string length to be greater than or equal to the length.
   *
   * @param length The minimum string length.
   * @param options The constraint options or an issue message.
   * @returns The clone of the shape.
   */
  min(length: number, options?: ConstraintOptions | Message): this {
    const issueFactory = createIssueFactory(CODE_STRING_MIN, MESSAGE_STRING_MIN, options, length);

    return appendCheck(this, CODE_STRING_MIN, options, length, (input, options) => {
      if (input.length < length) {
        return issueFactory(input, options);
      }
    });
  }

  /**
   * Constrains the string length to be less than or equal to the length.
   *
   * @param length The maximum string length.
   * @param options The constraint options or an issue message.
   * @returns The clone of the shape.
   */
  max(length: number, options?: ConstraintOptions | Message): this {
    const issueFactory = createIssueFactory(CODE_STRING_MAX, MESSAGE_STRING_MAX, options, length);

    return appendCheck(this, CODE_STRING_MAX, options, length, (input, options) => {
      if (input.length > length) {
        return issueFactory(input, options);
      }
    });
  }

  /**
   * Constrains the string to match a regexp.
   *
   * @param re The regular expression that the sting must conform.
   * @param options The constraint options or an issue message.
   * @returns The clone of the shape.
   */
  regex(re: RegExp, options?: ConstraintOptions | Message): this {
    const issueFactory = createIssueFactory(CODE_STRING_REGEX, MESSAGE_STRING_REGEX, options, re);

    return appendCheck(this, CODE_STRING_REGEX, options, re, (input, options) => {
      re.lastIndex = 0;

      if (!re.test(input)) {
        return issueFactory(input, options);
      }
    });
  }

  protected _getInputTypes(): readonly ValueType[] {
    return this._coerced ? coercibleTypes : stringTypes;
  }

  protected _apply(input: unknown, options: ParseOptions): ApplyResult<string> {
    const { _applyChecks } = this;

    if (options.coerced || this._coerced) {
      return this._applyToCoerced(input, options);
    }
    if (typeof input !== 'string') {
      return this._issueFactory(input, options);
    }
    if (_applyChecks !== null) {
      return _applyChecks(input, null, options);
    }
    return null;
  }

  private _applyToCoerced(input: unknown, options: ParseOptions): ApplyResult<string> {
    const { _applyChecks } = this;

    const output = coerceString(input, input);

    let issues: Issue[] | null = null;

    if (typeof output !== 'string') {
      return this._issueFactory(input, options);
    }
    if (_applyChecks !== null) {
      issues = _applyChecks(output, null, options);
    }
    if (issues === null && input !== output) {
      return ok(output);
    }
    return issues;
  }
}

export function coerceString(value: unknown, defaultValue: unknown): unknown {
  const type = typeof value;

  if (value == null) {
    return '';
  }
  if (type === 'string') {
    return value;
  }
  if ((type === 'number' && Number.isFinite(value)) || type === 'boolean' || type === 'bigint') {
    return '' + value;
  }
  if (isArray(value) && value.length === 1) {
    return coerceString(value[0], defaultValue);
  }
  return defaultValue;
}
