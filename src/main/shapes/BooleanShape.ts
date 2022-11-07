import { Shape } from './Shape';
import { ApplyResult, Message, ParseOptions, TypeConstraintOptions } from '../shared-types';
import { createCheckConfig, raiseIssue } from '../utils';
import { CODE_TYPE, MESSAGE_BOOLEAN_TYPE, TYPE_BOOLEAN } from './constants';

export class BooleanShape extends Shape<boolean> {
  protected _typeCheckConfig;

  constructor(options?: TypeConstraintOptions | Message) {
    super();
    this._typeCheckConfig = createCheckConfig(options, CODE_TYPE, MESSAGE_BOOLEAN_TYPE, TYPE_BOOLEAN);
  }

  apply(input: unknown, options: ParseOptions): ApplyResult<boolean> {
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
