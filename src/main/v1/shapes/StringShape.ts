import { ConstraintOptions, ParserOptions } from '../shared-types';
import { Shape } from './Shape';
import { addConstraint, applyConstraints, raiseError, raiseIssue } from '../utils';

export class StringShape extends Shape<string> {
  constructor(protected options?: ConstraintOptions | string) {
    super(false);
  }

  length(length: number, options?: ConstraintOptions | string): this {
    return this.min(length, options).max(length, options);
  }

  min(length: number, options?: ConstraintOptions | string): this {
    return addConstraint(this, 'min', input => {
      if (input.length < length) {
        raiseIssue(input, 'stringMinLength', length, options, 'Must have the minimum length of ' + length);
      }
    });
  }

  max(length: number, options?: ConstraintOptions | string): this {
    return addConstraint(this, 'max', input => {
      if (input.length > length) {
        raiseIssue(input, 'stringMaxLength', length, options, 'Must have the maximum length of ' + length);
      }
    });
  }

  regex(re: RegExp, options?: ConstraintOptions | string): this {
    return addConstraint(this, 'regex', input => {
      if (!re.test(input)) {
        raiseIssue(input, 'stringRegex', re, options, 'Must match the pattern ' + re);
      }
    });
  }

  parse(input: unknown, options?: ParserOptions): string {
    if (typeof input !== 'string') {
      raiseIssue(input, 'type', 'string', this.options, 'Must be a string');
    }

    const { constraints } = this;

    if (constraints !== undefined) {
      raiseError(applyConstraints(input, constraints, options, null));
    }
    return input;
  }
}
