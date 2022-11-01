import { Shape } from './Shape';
import { ApplyResult, Message, ParserOptions, TypeCheckOptions } from '../shared-types';
import { createCheckConfig, raiseIssue } from '../shape-utils';
import { CODE_INSTANCE, MESSAGE_INSTANCE } from './constants';

export type InferInstance<C> = C extends new (...args: any[]) => infer T ? T : never;

/**
 * The class instance shape.
 *
 * @template C The class constructor.
 */
export class InstanceShape<C extends new (...args: any[]) => any> extends Shape<InferInstance<C>> {
  protected _typeCheckConfig;

  constructor(readonly ctor: C, options?: TypeCheckOptions | Message) {
    super(false);
    this._typeCheckConfig = createCheckConfig(options, CODE_INSTANCE, MESSAGE_INSTANCE, ctor);
  }

  _apply(input: unknown, options: ParserOptions): ApplyResult<InferInstance<C>> {
    const { _applyChecks } = this;

    if (!(input instanceof this.ctor)) {
      return raiseIssue(this._typeCheckConfig, input);
    }
    if (_applyChecks !== null) {
      return _applyChecks(input, null, options);
    }
    return null;
  }
}
