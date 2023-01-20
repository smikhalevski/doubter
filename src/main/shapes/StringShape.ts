import { ValueType } from './Shape';
import { ApplyResult, ConstraintOptions, Issue, Message, ParseOptions, TypeConstraintOptions } from '../shared-types';
import { createIssueFactory, isArray, ok, setCheck } from '../utils';
import {
  CODE_STRING_MAX,
  CODE_STRING_MIN,
  CODE_STRING_REGEX,
  CODE_TYPE,
  MESSAGE_STRING_MAX,
  MESSAGE_STRING_MIN,
  MESSAGE_STRING_REGEX,
  MESSAGE_STRING_TYPE,
  TYPE_ARRAY,
  TYPE_BIGINT,
  TYPE_BOOLEAN,
  TYPE_NULL,
  TYPE_NUMBER,
  TYPE_STRING,
  TYPE_UNDEFINED,
} from '../constants';
import { CoercibleShape } from './CoercibleShape';
import { NEVER } from './IntersectionShape';

/**
 * The shape that constrains the input as a string.
 */
export class StringShape extends CoercibleShape<string> {
  protected _typeIssueFactory;

  /**
   * Creates a new {@linkcode StringShape} instance.
   *
   * @param options The type constraint options or the type issue message.
   */
  constructor(options?: TypeConstraintOptions | Message) {
    super();

    this._typeIssueFactory = createIssueFactory(CODE_TYPE, MESSAGE_STRING_TYPE, options, TYPE_STRING);
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

    return setCheck(this, CODE_STRING_MIN, options, length, (input, options) => {
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

    return setCheck(this, CODE_STRING_MAX, options, length, (input, options) => {
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

    return setCheck(this, CODE_STRING_REGEX, options, re, (input, options) => {
      re.lastIndex = 0;

      if (!re.test(input)) {
        return issueFactory(input, options);
      }
    });
  }

  protected _getInputTypes(): ValueType[] {
    if (this._coerced) {
      return [TYPE_STRING, TYPE_NUMBER, TYPE_BOOLEAN, TYPE_BIGINT, TYPE_ARRAY, TYPE_UNDEFINED, TYPE_NULL];
    } else {
      return [TYPE_STRING];
    }
  }

  protected _apply(input: any, options: ParseOptions): ApplyResult<string> {
    const { _applyChecks } = this;

    let output = input;
    let issues: Issue[] | null = null;
    let changed = false;

    if (
      typeof output !== 'string' &&
      (!(changed = options.coerced || this._coerced) || (output = this._coerce(input)) === NEVER)
    ) {
      return this._typeIssueFactory(input, options);
    }
    if (_applyChecks !== null) {
      issues = _applyChecks(output, null, options);
    }
    if (changed && issues === null) {
      return ok(output);
    }
    return issues;
  }

  protected _coerce(input: unknown): unknown {
    if (typeof input === 'string') {
      return input;
    }
    if (input == null) {
      return '';
    }
    if (
      (typeof input === 'number' && input === input && input !== Infinity && input !== -Infinity) ||
      typeof input === 'boolean' ||
      typeof input === 'bigint'
    ) {
      return '' + input;
    }
    if (isArray(input) && input.length === 1) {
      return this._coerce(input[0]);
    }
    return NEVER;
  }
}
