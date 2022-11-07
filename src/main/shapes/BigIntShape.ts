import { Shape } from './Shape';
import { ApplyResult, Message, ParseOptions, TypeConstraintOptions } from '../shared-types';
import { createCheckConfig, raiseIssue } from '../utils';
import { CODE_TYPE, MESSAGE_BIGINT_TYPE, TYPE_BIGINT } from './constants';

export class BigIntShape extends Shape<bigint> {
  protected _typeCheckConfig;

  constructor(options?: TypeConstraintOptions | Message) {
    super();
    this._typeCheckConfig = createCheckConfig(options, CODE_TYPE, MESSAGE_BIGINT_TYPE, TYPE_BIGINT);
  }

  apply(input: unknown, options: ParseOptions): ApplyResult<bigint> {
    const { _applyChecks } = this;

    if (typeof input !== 'bigint') {
      return raiseIssue(this._typeCheckConfig, input);
    }
    if (_applyChecks !== null) {
      return _applyChecks(input, null, options);
    }
    return null;
  }
}
