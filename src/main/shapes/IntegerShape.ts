import { Shape } from './Shape';
import { ApplyResult, Message, ParserOptions, TypeCheckOptions } from '../shared-types';
import { createCheckConfig, raiseIssue } from '../shape-utils';
import { CODE_TYPE, MESSAGE_INTEGER_TYPE, TYPE_INTEGER } from './constants';
import { isInteger } from '../lang-utils';

export class IntegerShape extends Shape<number> {
  protected _typeCheckConfig;

  constructor(options?: TypeCheckOptions | Message) {
    super(false);
    this._typeCheckConfig = createCheckConfig(options, CODE_TYPE, MESSAGE_INTEGER_TYPE, TYPE_INTEGER);
  }

  _apply(input: unknown, options: ParserOptions): ApplyResult<number> {
    const { _applyChecks } = this;

    if (!isInteger(input)) {
      return raiseIssue(this._typeCheckConfig, input);
    }
    if (_applyChecks !== null) {
      return _applyChecks(input, null, options);
    }
    return null;
  }
}
