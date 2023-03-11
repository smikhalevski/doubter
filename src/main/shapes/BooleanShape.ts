import { CODE_TYPE, MESSAGE_BOOLEAN_TYPE } from '../constants';
import { ApplyOptions, ConstraintOptions, Message } from '../types';
import { ARRAY, BOOLEAN, canonize, createIssueFactory, isArray, NUMBER, OBJECT, ok, STRING } from '../utils';
import { CoercibleShape } from './CoercibleShape';
import { NEVER, Result } from './Shape';

/**
 * The shape of the boolean value.
 */
export class BooleanShape extends CoercibleShape<boolean> {
  protected _typeIssueFactory;

  /**
   * Creates a new {@linkcode BooleanShape} instance.
   *
   * @param options The type constraint options or the type issue message.
   */
  constructor(options?: ConstraintOptions | Message) {
    super();

    this._typeIssueFactory = createIssueFactory(CODE_TYPE, MESSAGE_BOOLEAN_TYPE, options, BOOLEAN);
  }

  protected _getInputTypes(): unknown[] {
    if (this.isCoerced) {
      return [BOOLEAN, OBJECT, STRING, NUMBER, ARRAY, undefined, null];
    } else {
      return [BOOLEAN];
    }
  }

  protected _apply(input: any, options: ApplyOptions): Result<boolean> {
    const { _applyChecks } = this;

    let output = input;
    let issues = null;
    let changed = false;

    if (
      typeof output !== 'boolean' &&
      (!(changed = options.coerced || this.isCoerced) || (output = this._coerce(input)) === NEVER)
    ) {
      return this._typeIssueFactory(input, options);
    }
    if ((_applyChecks === null || (issues = _applyChecks(output, null, options)) === null) && changed) {
      return ok(output);
    }
    return issues;
  }

  /**
   * Coerces a value to a boolean or returns {@linkcode NEVER} if coercion isn't possible.
   *
   * @param value The non-boolean value to coerce.
   */
  protected _coerce(value: unknown): boolean {
    if (isArray(value) && value.length === 1 && typeof (value = value[0]) === 'boolean') {
      return value;
    }

    value = canonize(value);

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
