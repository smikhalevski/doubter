import { CODE_TYPE, MESSAGE_TYPE_NUMBER } from '../constants';
import { getCanonicalValueOf, isArray } from '../internal';
import { TYPE_ARRAY, TYPE_BOOLEAN, TYPE_DATE, TYPE_NUMBER, TYPE_OBJECT, TYPE_STRING } from '../Type';
import { Any, ApplyOptions, IssueOptions, Message, Result } from '../types';
import { createIssueFactory } from '../utils';
import { CoercibleShape } from './CoercibleShape';
import { AllowShape, NEVER, ReplaceShape } from './Shape';

/**
 * The shape of a number value.
 *
 * @group Shapes
 */
export class NumberShape extends CoercibleShape<number> {
  /**
   * Returns issues associated with an invalid input value type.
   */
  protected _typeIssueFactory;

  /**
   * Creates a new {@link NumberShape} instance.
   *
   * @param options The issue options or the issue message.
   */
  constructor(options?: IssueOptions | Message) {
    super();

    this._typeIssueFactory = createIssueFactory(CODE_TYPE, MESSAGE_TYPE_NUMBER, options, TYPE_NUMBER);
  }

  /**
   * Allows `NaN` as an input and output value.
   */
  nan(): AllowShape<this, number>;

  /**
   * Replaces an input `NaN` value with a default output value.
   *
   * @param defaultValue The value that is used instead of `NaN` in the output.
   */
  nan<T extends Any>(defaultValue: T): ReplaceShape<this, number, T>;

  nan(defaultValue?: any) {
    return this.replace(NaN, arguments.length === 0 ? NaN : defaultValue);
  }

  protected _getInputs(): unknown[] {
    if (this.isCoercing) {
      return [TYPE_NUMBER, TYPE_OBJECT, TYPE_STRING, TYPE_BOOLEAN, TYPE_ARRAY, TYPE_DATE, null, undefined];
    } else {
      return [TYPE_NUMBER];
    }
  }

  protected _apply(input: any, options: ApplyOptions, nonce: number): Result<number> {
    let output = input;

    if (
      (typeof output !== 'number' || output !== output) &&
      (!(options.coerce || this.isCoercing) || (output = this._coerce(input)) === NEVER)
    ) {
      return [this._typeIssueFactory(input, options)];
    }
    return this._applyOperations(input, output, options, null);
  }

  /**
   * Coerces a value to a number (not `NaN`).
   *
   * @param value The non-number value to coerce.
   * @returns A number value, or {@link NEVER} if coercion isn't possible.
   */
  protected _coerce(value: any): number {
    if (isArray(value) && value.length === 1 && typeof (value = value[0]) === 'number') {
      return value === value ? value : NEVER;
    }
    if (value === null || value === undefined) {
      return 0;
    }

    value = getCanonicalValueOf(value);

    if (
      (typeof value === 'string' || typeof value === 'boolean' || typeof value === 'number' || value instanceof Date) &&
      (value = +value) === value
    ) {
      return value;
    }
    return NEVER;
  }
}
