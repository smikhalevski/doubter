import { Shape } from './Shape';
import { ApplyResult, Message, ParserOptions, TypeCheckOptions } from '../shared-types';
import { createCheckConfig, raiseIssue } from '../shape-utils';
import { CODE_NEVER, MESSAGE_NEVER } from './constants';

export class NeverShape extends Shape<never> {
  protected _typeCheckConfig;

  constructor(options?: TypeCheckOptions | Message) {
    super(false);
    this._typeCheckConfig = createCheckConfig(options, CODE_NEVER, MESSAGE_NEVER, undefined);
  }

  _apply(input: unknown, options: ParserOptions): ApplyResult<never> {
    return raiseIssue(this._typeCheckConfig, input);
  }
}
