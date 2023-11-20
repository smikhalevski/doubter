import { CODE_TYPE_INSTANCE_OF } from '../constants';
import { isEqualOrSubclass } from '../internal/lang';
import { arrayInputs, dateInputs, functionInputs, mapInputs, objectInputs, promiseInputs, setInputs } from '../types';
import { ApplyOptions, IssueOptions, Message, Result } from '../typings';
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
   * Creates a new {@link InstanceShape} instance.
   *
   * @param ctor The class constructor.
   * @param options The issue options or the issue message.
   * @template Ctor The class constructor.
   */
  constructor(
    readonly ctor: Ctor,
    options?: IssueOptions | Message
  ) {
    super();

    this._typeIssueFactory = createIssueFactory(
      CODE_TYPE_INSTANCE_OF,
      Shape.messages[CODE_TYPE_INSTANCE_OF],
      options,
      ctor
    );
  }

  protected _getInputs(): readonly unknown[] {
    const { ctor } = this;

    if (isEqualOrSubclass(ctor, Function)) {
      return functionInputs;
    }
    if (isEqualOrSubclass(ctor, Promise)) {
      return promiseInputs;
    }
    if (isEqualOrSubclass(ctor, Array)) {
      return arrayInputs;
    }
    if (isEqualOrSubclass(ctor, Date)) {
      return dateInputs;
    }
    if (isEqualOrSubclass(ctor, Set)) {
      return setInputs;
    }
    if (isEqualOrSubclass(ctor, Map)) {
      return mapInputs;
    }
    return objectInputs;
  }

  protected _apply(input: unknown, options: ApplyOptions, nonce: number): Result<InstanceType<Ctor>> {
    if (!(input instanceof this.ctor)) {
      return [this._typeIssueFactory(input, options)];
    }
    return this._applyOperations(input, input, options, null) as Result;
  }
}
