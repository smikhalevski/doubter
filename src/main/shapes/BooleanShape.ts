import { ValueType } from './Shape';
import { ApplyResult, Issue, Message, ParseOptions, TypeConstraintOptions } from '../shared-types';
import { createIssueFactory, isArray, ok } from '../utils';
import {
  CODE_TYPE,
  MESSAGE_BOOLEAN_TYPE,
  TYPE_ARRAY,
  TYPE_BOOLEAN,
  TYPE_NULL,
  TYPE_NUMBER,
  TYPE_STRING,
  TYPE_UNDEFINED,
} from '../constants';
import { CoercibleShape } from './CoercibleShape';
import { NEVER } from './IntersectionShape';

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
  constructor(options?: TypeConstraintOptions | Message) {
    super();

    this._typeIssueFactory = createIssueFactory(CODE_TYPE, MESSAGE_BOOLEAN_TYPE, options, TYPE_BOOLEAN);
  }

  protected _getInputTypes(): ValueType[] {
    if (this._coerced) {
      return [TYPE_BOOLEAN, TYPE_STRING, TYPE_NUMBER, TYPE_ARRAY, TYPE_NULL, TYPE_UNDEFINED];
    } else {
      return [TYPE_BOOLEAN];
    }
  }

  protected _apply(input: any, options: ParseOptions): ApplyResult<boolean> {
    const { _applyChecks } = this;

    let output = input;
    let issues: Issue[] | null = null;
    let changed = false;

    if (
      typeof output !== 'boolean' &&
      (!(changed = options.coerced || this._coerced) || (output = this._coerce(input)) === NEVER)
    ) {
      return this._typeIssueFactory(input, options);
    }
    if (_applyChecks !== null) {
      issues = _applyChecks(output, null, options);
    }
    if (changed && issues === null) {
      return ok(output);
    }
    return issues;
  }

  protected _coerce(input: unknown): unknown {
    if (typeof input === 'boolean') {
      return input;
    }
    if (input == null || input === false || input === 0 || input === 'false') {
      return false;
    }
    if (input === true || input === 1 || input === 'true') {
      return true;
    }
    if (isArray(input) && input.length === 1) {
      return this._coerce(input[0]);
    }
    return NEVER;
  }
}
