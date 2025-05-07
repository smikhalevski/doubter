import { CODE_TYPE_INSTANCE_OF, MESSAGE_TYPE_INSTANCE_OF } from '../constants.js';
import { isEqualOrSubclass } from '../internal/lang.js';
import { Type } from '../Type.js';
import { IssueOptions, Message, ParseOptions, Result } from '../types.js';
import { createIssue } from '../utils.js';
import { Shape } from './Shape.js';

const arrayInputs = Object.freeze<unknown[]>([Type.ARRAY]);
const dateInputs = Object.freeze<unknown[]>([Type.DATE]);
const functionInputs = Object.freeze<unknown[]>([Type.FUNCTION]);
const mapInputs = Object.freeze<unknown[]>([Type.MAP]);
const objectInputs = Object.freeze<unknown[]>([Type.OBJECT]);
const promiseInputs = Object.freeze<unknown[]>([Type.PROMISE]);
const setInputs = Object.freeze<unknown[]>([Type.SET]);

/**
 * The shape of the class instance.
 *
 * @template Ctor The class constructor.
 * @group Shapes
 */
export class InstanceShape<Ctor extends new (...args: any) => any> extends Shape<InstanceType<Ctor>> {
  /**
   * The type issue options or the type issue message.
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

    this._options = options;
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

  protected _apply(input: unknown, options: ParseOptions, _nonce: number): Result<InstanceType<Ctor>> {
    if (!(input instanceof this.ctor)) {
      return [createIssue(CODE_TYPE_INSTANCE_OF, input, MESSAGE_TYPE_INSTANCE_OF, this.ctor, options, this._options)];
    }
    return this._applyOperations(input, input, options, null) as Result;
  }
}
