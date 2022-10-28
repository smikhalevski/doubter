import { Shape } from './Shape';
import { ApplyResult, Message, TypeCheckOptions } from '../shared-types';
import { createCheckConfig, raiseIssue } from '../shape-utils';
import { CODE_TYPE, MESSAGE_BOOLEAN_TYPE, TYPE_BOOLEAN } from '../../shapes/constants';

export class BooleanShape extends Shape<boolean> {
  private _typeCheckConfig;

  constructor(options?: TypeCheckOptions | Message) {
    super(false);
    this._typeCheckConfig = createCheckConfig(options, CODE_TYPE, MESSAGE_BOOLEAN_TYPE, TYPE_BOOLEAN);
  }

  _apply(input: unknown, earlyReturn: boolean): ApplyResult<boolean> {
    const { applyChecks } = this;

    if (typeof input !== 'boolean') {
      return raiseIssue(this._typeCheckConfig, input);
    }
    if (applyChecks !== null) {
      return applyChecks(input, null, earlyReturn);
    }
    return null;
  }
}
