import { Shape } from './Shape';
import { ApplyResult, Message, ParseOptions, TypeConstraintOptions } from '../shared-types';
import { arrayTypes, createIssueFactory, objectTypes } from '../utils';
import { CODE_INSTANCE, MESSAGE_INSTANCE } from '../constants';

/**
 * The shape of the class instance.
 *
 * @template C The class constructor.
 */
export class InstanceShape<C extends new (...args: any[]) => any> extends Shape<InstanceType<C>> {
  protected _typeIssueFactory;

  /**
   * Creates a new {@linkcode InstanceShape} instance.
   *
   * @param ctor The class constructor.
   * @param options The type constraint options or the type issue message.
   * @template C The class constructor.
   */
  constructor(readonly ctor: C, options?: TypeConstraintOptions | Message) {
    super((ctor as unknown) === Array || Array.prototype.isPrototypeOf(ctor.prototype) ? arrayTypes : objectTypes);

    this._typeIssueFactory = createIssueFactory(CODE_INSTANCE, MESSAGE_INSTANCE, options, ctor);
  }

  apply(input: unknown, options: ParseOptions): ApplyResult<InstanceType<C>> {
    const { _applyChecks } = this;

    if (!(input instanceof this.ctor)) {
      return [this._typeIssueFactory(input, options)];
    }
    if (_applyChecks !== null) {
      return _applyChecks(input, null, options);
    }
    return null;
  }
}
