import { CODE_INSTANCE, MESSAGE_INSTANCE } from '../constants';
import { isEqualOrSubclass } from '../internal';
import { TYPE_ARRAY, TYPE_DATE, TYPE_FUNCTION, TYPE_MAP, TYPE_OBJECT, TYPE_PROMISE, TYPE_SET } from '../Type';
import { ApplyOptions, IssueOptions, Message, Result } from '../types';
import { createIssueFactory } from '../utils';
import { Shape } from './Shape';

/**
 * The shape of the class instance.
 *
 * @template Ctor The class constructor.
 * @group Shapes
 */
export class InstanceShape<Ctor extends new (...args: any) => any> extends Shape<InstanceType<Ctor>> {
  /**
   * Returns issues associated with an invalid input value type.
   */
  protected _typeIssueFactory;

  /**
   * Creates a new {@linkcode InstanceShape} instance.
   *
   * @param ctor The class constructor.
   * @param options The issue options or the issue message.
   * @template Ctor The class constructor.
   */
  constructor(readonly ctor: Ctor, options?: IssueOptions | Message) {
    super();

    this._typeIssueFactory = createIssueFactory(CODE_INSTANCE, MESSAGE_INSTANCE, options, ctor);
  }

  protected _getInputs(): unknown[] {
    const { ctor } = this;

    if (isEqualOrSubclass(ctor, Function)) {
      return [TYPE_FUNCTION];
    }
    if (isEqualOrSubclass(ctor, Promise)) {
      return [TYPE_PROMISE];
    }
    if (isEqualOrSubclass(ctor, Array)) {
      return [TYPE_ARRAY];
    }
    if (isEqualOrSubclass(ctor, Date)) {
      return [TYPE_DATE];
    }
    if (isEqualOrSubclass(ctor, Set)) {
      return [TYPE_SET];
    }
    if (isEqualOrSubclass(ctor, Map)) {
      return [TYPE_MAP];
    }
    return [TYPE_OBJECT];
  }

  protected _apply(input: unknown, options: ApplyOptions, nonce: number): Result<InstanceType<Ctor>> {
    if (!(input instanceof this.ctor)) {
      return [this._typeIssueFactory(input, options)];
    }
    return this._applyOperations(input, input, options, null);
  }
}
