import { Shape } from './Shape';
import { ApplyResult, Message, ParseOptions, TypeConstraintOptions } from '../shared-types';
import { createCheckConfig, raiseIssue } from '../utils';
import { CODE_NEVER, MESSAGE_NEVER } from './constants';

export class NeverShape extends Shape<never> {
  protected _typeCheckConfig;

  constructor(options?: TypeConstraintOptions | Message) {
    super();
    this._typeCheckConfig = createCheckConfig(options, CODE_NEVER, MESSAGE_NEVER, undefined);
  }

  apply(input: unknown, options: ParseOptions): ApplyResult<never> {
    return raiseIssue(this._typeCheckConfig, input);
  }
}
