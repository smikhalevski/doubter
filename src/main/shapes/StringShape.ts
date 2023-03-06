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
  TYPE_OBJECT,
  TYPE_STRING,
  TYPE_UNDEFINED,
} from '../constants';
import { ApplyOptions, ConstraintOptions, Message } from '../types';
import { addCheck, canonize, createIssueFactory, isArray, isValidDate, ok } from '../utils';
import { CoercibleShape } from './CoercibleShape';
import { NEVER, Result, ValueType } from './Shape';

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
  constructor(options?: ConstraintOptions | Message) {
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

    return addCheck(this, CODE_STRING_MIN, length, (input, param, options) => {
      if (input.length < param) {
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

    return addCheck(this, CODE_STRING_MAX, length, (input, param, options) => {
      if (input.length > param) {
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

    return addCheck(this, re.toString(), re, (input, param, options) => {
      param.lastIndex = 0;

      if (!param.test(input)) {
        return issueFactory(input, options);
      }
    });
  }

  protected _getInputTypes(): readonly ValueType[] {
    if (this.isCoerced) {
      return [TYPE_STRING, TYPE_OBJECT, TYPE_NUMBER, TYPE_BOOLEAN, TYPE_BIGINT, TYPE_ARRAY, TYPE_UNDEFINED, TYPE_NULL];
    } else {
      return [TYPE_STRING];
    }
  }

  protected _apply(input: any, options: ApplyOptions): Result<string> {
    const { _applyChecks } = this;

    let output = input;
    let issues = null;
    let changed = false;

    if (
      typeof output !== 'string' &&
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
   * Coerces a value to a string or returns {@linkcode NEVER} if coercion isn't possible.
   *
   * @param value The non-string value to coerce.
   */
  protected _coerce(value: any): string {
    if (isArray(value) && value.length === 1 && typeof (value = value[0]) === 'string') {
      return value;
    }
    if (value === null || value === undefined) {
      return '';
    }

    value = canonize(value);

    if (typeof value === 'string') {
      return value;
    }
    if (Number.isFinite(value) || typeof value === 'boolean' || typeof value === 'bigint') {
      return '' + value;
    }
    if (isValidDate(value)) {
      return value.toISOString();
    }
    return NEVER;
  }
}
