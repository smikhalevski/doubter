import { Shape } from './Shape';
import { InputConstraintOptions, ParserOptions } from '../shared-types';
import { raiseIfIssues, raiseIssue } from '../utils';
import { CODE_TYPE, MESSAGE_BOOLEAN_TYPE, TYPE_BOOLEAN } from './constants';

export class BooleanShape extends Shape<boolean> {
  constructor(protected options?: InputConstraintOptions | string) {
    super(false);
  }

  parse(input: unknown, options?: ParserOptions): boolean {
    if (typeof input !== 'boolean') {
      raiseIssue(input, CODE_TYPE, TYPE_BOOLEAN, this.options, MESSAGE_BOOLEAN_TYPE);
    }

    const { applyConstraints } = this;
    if (applyConstraints !== null) {
      raiseIfIssues(applyConstraints(input, options, null));
    }
    return input;
  }
}
