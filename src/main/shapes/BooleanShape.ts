import { Shape } from './Shape';
import { ApplyResult, Message, ParseOptions, TypeConstraintOptions } from '../shared-types';
import { createCheckConfig, raiseIssue } from '../shape-utils';
import { CODE_TYPE, MESSAGE_BOOLEAN_TYPE, TYPE_BOOLEAN } from './constants';

export class BooleanShape extends Shape<boolean> {
  protected _typeCheckConfig;

  constructor(options?: TypeConstraintOptions | Message) {
    super(false);
    this._typeCheckConfig = createCheckConfig(options, CODE_TYPE, MESSAGE_BOOLEAN_TYPE, TYPE_BOOLEAN);
  }

  apply(input: unknown, options: ParseOptions): ApplyResult<boolean> {
    const { applyChecks } = this;

    if (typeof input !== 'boolean') {
      return raiseIssue(this._typeCheckConfig, input);
    }
    if (applyChecks !== null) {
      return applyChecks(input, null, options);
    }
    return null;
  }
}
