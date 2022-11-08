import { Shape } from './Shape';
import { ApplyResult, Message, ParseOptions, TypeConstraintOptions } from '../shared-types';
import { createIssueFactory } from '../utils';
import { CODE_NEVER, MESSAGE_NEVER } from '../constants';

export class NeverShape extends Shape<never> {
  protected _typeIssueFactory;

  constructor(options?: TypeConstraintOptions | Message) {
    super();
    this._typeIssueFactory = createIssueFactory(CODE_NEVER, MESSAGE_NEVER, options, undefined);
  }

  apply(input: unknown, options: ParseOptions): ApplyResult<never> {
    return [this._typeIssueFactory(input)];
  }
}
