import { Type } from './Type';
import { cloneObject, raiseIssue, raiseIssuesIfDefined, raiseIssuesOrPush } from '../utils';
import { ConstraintOptions, ParserOptions } from '../shared-types';

/**
 * The string type definition.
 */
export class StringType extends Type<string> {
  protected minLength?: number;
  protected maxLength?: number;
  protected re?: RegExp;
  protected minLengthOptions?: ConstraintOptions;
  protected maxLengthOptions?: ConstraintOptions;
  protected reOptions?: ConstraintOptions;

  constructor(options?: ConstraintOptions) {
    super(false, options);
  }

  /**
   * Constrains the string length.
   */
  length(length: number, options?: ConstraintOptions): this {
    return this.min(length, options).max(length, options);
  }

  min(length: number, options?: ConstraintOptions): this {
    const type = cloneObject(this);
    type.minLength = length;
    type.minLengthOptions = options;
    return type;
  }

  max(length: number, options?: ConstraintOptions): this {
    const type = cloneObject(this);
    type.maxLength = length;
    type.maxLengthOptions = options;
    return type;
  }

  regex(re: RegExp, options?: ConstraintOptions): this {
    const type = cloneObject(this);
    type.re = re;
    type.reOptions = options;
    return type;
  }

  parse(input: unknown, options?: ParserOptions): string {
    if (typeof input !== 'string') {
      raiseIssue(input, 'type', 'string', this.options, 'Must be a string');
    }

    const { minLength, maxLength, re } = this;

    let issues;

    if (minLength != null && input.length < minLength) {
      issues = raiseIssuesOrPush(
        issues,
        options,
        input,
        'stringMinLength',
        minLength,
        this.minLengthOptions,
        'Must have the minimum length of ' + minLength
      );
    }

    if (maxLength != null && input.length > maxLength) {
      issues = raiseIssuesOrPush(
        issues,
        options,
        input,
        'stringMaxLength',
        maxLength,
        this.maxLengthOptions,
        'Must have the maximum length of ' + maxLength
      );
    }

    if (re != null && !re.test(input)) {
      issues = raiseIssuesOrPush(
        issues,
        options,
        input,
        'stringRegex',
        re,
        this.reOptions,
        'Must match the pattern ' + re
      );
    }

    raiseIssuesIfDefined(issues);

    return input;
  }
}
