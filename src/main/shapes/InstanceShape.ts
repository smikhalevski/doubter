import { Shape } from './Shape';
import { ApplyResult, Message, ParseOptions, TypeConstraintOptions } from '../shared-types';
import { arrayInputType, createIssueFactory, objectInputType } from '../utils';
import { CODE_INSTANCE, MESSAGE_INSTANCE } from '../constants';

export type InferInstance<C> = C extends new (...args: any[]) => infer T ? T : never;

/**
 * The class instance shape.
 *
 * @template C The class constructor.
 */
export class InstanceShape<C extends new (...args: any[]) => any> extends Shape<InferInstance<C>> {
  protected _typeIssueFactory;

  constructor(readonly ctor: C, options?: TypeConstraintOptions | Message) {
    super(Array.prototype.isPrototypeOf(ctor.prototype) ? arrayInputType : objectInputType);

    this._typeIssueFactory = createIssueFactory(CODE_INSTANCE, MESSAGE_INSTANCE, options, ctor);
  }

  apply(input: unknown, options: ParseOptions): ApplyResult<InferInstance<C>> {
    const { _applyChecks } = this;

    if (!(input instanceof this.ctor)) {
      return [this._typeIssueFactory(input)];
    }
    if (_applyChecks !== null) {
      return _applyChecks(input, null, options);
    }
    return null;
  }
}
