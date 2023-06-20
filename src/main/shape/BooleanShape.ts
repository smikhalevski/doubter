import { CODE_TYPE, MESSAGE_BOOLEAN_TYPE } from '../constants';
import { getCanonicalValueOf, isArray, ok } from '../internal';
import { TYPE_ARRAY, TYPE_BOOLEAN, TYPE_NUMBER, TYPE_OBJECT, TYPE_STRING } from '../Type';
import { ApplyOptions, ConstraintOptions, Message } from '../types';
import { createIssueFactory } from '../utils';
import { CoercibleShape } from './CoercibleShape';
import { NEVER, Result } from './Shape';

/**
 * The shape of a boolean value.
 */
export class BooleanShape extends CoercibleShape<boolean> {
  /**
   * Returns issues associated with an invalid input value type.
   */
  protected _typeIssueFactory;

  /**
   * Creates a new {@linkcode BooleanShape} instance.
   *
   * @param options The type constraint options or the type issue message.
   */
  constructor(options?: ConstraintOptions | Message) {
    super();

    this._typeIssueFactory = createIssueFactory(CODE_TYPE, MESSAGE_BOOLEAN_TYPE, options, TYPE_BOOLEAN);
  }

  protected _getInputs(): unknown[] {
    if (this.isCoercing) {
      return [TYPE_BOOLEAN, TYPE_OBJECT, TYPE_STRING, TYPE_NUMBER, TYPE_ARRAY, null, undefined];
    } else {
      return [TYPE_BOOLEAN];
    }
  }

  protected _apply(input: any, options: ApplyOptions, nonce: number): Result<boolean> {
    const { _applyChecks } = this;

    let output = input;
    let issues = null;
    let changed = false;

    if (
      typeof output !== 'boolean' &&
      (!(changed = options.coerce || this.isCoercing) || (output = this._coerce(input)) === NEVER)
    ) {
      return this._typeIssueFactory(input, options);
    }
    if ((_applyChecks === null || (issues = _applyChecks(output, null, options)) === null) && changed) {
      return ok(output);
    }
    return issues;
  }

  /**
   * Coerces a value to a boolean.
   *
   * @param value The non-boolean value to coerce.
   * @returns A boolean value, or {@linkcode NEVER} if coercion isn't possible.
   */
  protected _coerce(value: unknown): boolean {
    if (isArray(value) && value.length === 1 && typeof (value = value[0]) === 'boolean') {
      return value;
    }

    value = getCanonicalValueOf(value);

    if (typeof value === 'boolean') {
      return value;
    }
    if (value === null || value === undefined || value === false || value === 0 || value === 'false') {
      return false;
    }
    if (value === true || value === 1 || value === 'true') {
      return true;
    }
    return NEVER;
  }
}
