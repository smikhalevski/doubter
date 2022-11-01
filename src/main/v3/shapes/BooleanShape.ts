import { Shape } from './Shape';
import { ApplyResult, Message, ParserOptions, TypeCheckOptions } from '../shared-types';
import { createCheckConfig, raiseIssue } from '../shape-utils';
import { CODE_TYPE, MESSAGE_BOOLEAN_TYPE, TYPE_BOOLEAN } from './constants';

export class BooleanShape extends Shape<boolean> {
  private _typeCheckConfig;

  constructor(options?: TypeCheckOptions | Message) {
    super(false);
    this._typeCheckConfig = createCheckConfig(options, CODE_TYPE, MESSAGE_BOOLEAN_TYPE, TYPE_BOOLEAN);
  }

  _apply(input: unknown, options: ParserOptions): ApplyResult<boolean> {
    const { _applyChecks } = this;

    if (typeof input !== 'boolean') {
      return raiseIssue(this._typeCheckConfig, input);
    }
    if (_applyChecks !== null) {
      return _applyChecks(input, null, options);
    }
    return null;
  }
}
