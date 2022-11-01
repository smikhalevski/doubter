import { Shape } from './Shape';
import { ApplyResult, Message, ParserOptions, TypeCheckOptions } from '../shared-types';
import { createCheckConfig, raiseIssue } from '../shape-utils';
import { CODE_TYPE, MESSAGE_BIGINT_TYPE, TYPE_BIGINT } from '../../shapes/constants';

export class BigIntShape extends Shape<bigint> {
  private _typeCheckConfig;

  constructor(options?: TypeCheckOptions | Message) {
    super(false);
    this._typeCheckConfig = createCheckConfig(options, CODE_TYPE, MESSAGE_BIGINT_TYPE, TYPE_BIGINT);
  }

  _apply(input: unknown, options: ParserOptions): ApplyResult<bigint> {
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
