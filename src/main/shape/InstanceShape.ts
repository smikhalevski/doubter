import { CODE_TYPE_INSTANCE_OF, MESSAGE_TYPE_INSTANCE_OF } from '../constants';
import { isEqualOrSubclass } from '../internal/lang';
import { Type } from '../Type';
import { ApplyOptions, IssueOptions, Message, Result } from '../types';
import { createIssue, toIssueOptions } from '../utils';
import { Shape } from './Shape';

const arrayInputs = Object.freeze([Type.ARRAY]);
const dateInputs = Object.freeze([Type.DATE]);
const functionInputs = Object.freeze([Type.FUNCTION]);
const mapInputs = Object.freeze([Type.MAP]);
const objectInputs = Object.freeze([Type.OBJECT]);
const promiseInputs = Object.freeze([Type.PROMISE]);
const setInputs = Object.freeze([Type.SET]);

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
  protected _options;

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

    this._options = toIssueOptions(options);
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
      return [createIssue(CODE_TYPE_INSTANCE_OF, input, MESSAGE_TYPE_INSTANCE_OF, this.ctor, options, this._options)];
    }
    return this._applyOperations(input, input, options, null) as Result;
  }
}
