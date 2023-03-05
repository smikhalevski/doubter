import { CODE_INSTANCE, MESSAGE_INSTANCE, TYPE_ARRAY, TYPE_DATE, TYPE_OBJECT } from '../constants';
import { ApplyOptions, ConstraintOptions, Message } from '../types';
import { createIssueFactory, isEqualOrSubclass } from '../utils';
import { Result, Shape, ValueType } from './Shape';

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
  constructor(readonly ctor: C, options?: ConstraintOptions | Message) {
    super();

    this._typeIssueFactory = createIssueFactory(CODE_INSTANCE, MESSAGE_INSTANCE, options, ctor);
  }

  protected _getInputTypes(): readonly ValueType[] {
    if (isEqualOrSubclass(this.ctor, Array)) {
      return [TYPE_ARRAY];
    }
    if (isEqualOrSubclass(this.ctor, Date)) {
      return [TYPE_DATE];
    }
    return [TYPE_OBJECT];
  }

  protected _apply(input: unknown, options: ApplyOptions): Result<InstanceType<C>> {
    const { _applyChecks } = this;

    if (!(input instanceof this.ctor)) {
      return this._typeIssueFactory(input, options);
    }
    if (_applyChecks !== null) {
      return _applyChecks(input, null, options);
    }
    return null;
  }
}
