import { CODE_TYPE, MESSAGE_TYPE_STRING } from '../constants';
import { getCanonicalValueOf, isArray, isValidDate } from '../internal';
import { TYPE_ARRAY, TYPE_BIGINT, TYPE_BOOLEAN, TYPE_NUMBER, TYPE_OBJECT, TYPE_STRING } from '../Type';
import { ApplyOptions, IssueOptions, Message, Result } from '../types';
import { createIssueFactory } from '../utils';
import { CoercibleShape } from './CoercibleShape';
import { NEVER } from './Shape';

/**
 * The shape of a string value.
 *
 * @group Shapes
 */
export class StringShape extends CoercibleShape<string> {
  /**
   * Returns issues associated with an invalid input value type.
   */
  protected _typeIssueFactory;

  /**
   * Creates a new {@linkcode StringShape} instance.
   *
   * @param options The issue options or the issue message.
   */
  constructor(options?: IssueOptions | Message) {
    super();

    this._typeIssueFactory = createIssueFactory(CODE_TYPE, MESSAGE_TYPE_STRING, options, TYPE_STRING);
  }

  protected _getInputs(): unknown[] {
    if (this.isCoercing) {
      return [TYPE_STRING, TYPE_OBJECT, TYPE_NUMBER, TYPE_BOOLEAN, TYPE_BIGINT, TYPE_ARRAY, null, undefined];
    } else {
      return [TYPE_STRING];
    }
  }

  protected _apply(input: any, options: ApplyOptions, nonce: number): Result<string> {
    let output = input;

    if (
      typeof output !== 'string' &&
      (!(options.coerce || this.isCoercing) || (output = this._coerce(input)) === NEVER)
    ) {
      return [this._typeIssueFactory(input, options)];
    }
    return this._applyOperations(input, output, options, null);
  }

  /**
   * Coerces a value to a string.
   *
   * @param value The non-string value to coerce.
   * @returns A string value, or {@linkcode NEVER} if coercion isn't possible.
   */
  protected _coerce(value: unknown): string {
    if (isArray(value) && value.length === 1 && typeof (value = value[0]) === 'string') {
      return value;
    }
    if (value === null || value === undefined) {
      return '';
    }

    value = getCanonicalValueOf(value);

    if (typeof value === 'string') {
      return value;
    }
    if (Number.isFinite(value) || typeof value === 'boolean' || typeof value === 'bigint') {
      return '' + value;
    }
    if (isValidDate(value)) {
      return value.toISOString();
    }
    return NEVER;
  }
}
