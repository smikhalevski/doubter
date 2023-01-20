import { Shape, ValueType } from './Shape';
import { ApplyResult, Message, ParseOptions, TypeConstraintOptions } from '../shared-types';
import { clone, createIssueFactory, ok } from '../utils';
import { CODE_JSON, CODE_TYPE, MESSAGE_STRING_TYPE, TYPE_STRING } from '../constants';

/**
 * The shape of a value deserialized from a JSON string.
 */
export class JSONShape extends Shape<string, any> {
  protected _typeIssueFactory;
  protected _jsonIssueFactory;
  protected _reviver?: (this: any, key: string, value: any) => any;

  /**
   * Creates a new {@linkcode JSONShape} instance.
   *
   * @param options The type constraint options or the type issue message.
   */
  constructor(options?: TypeConstraintOptions | Message) {
    super();

    this._typeIssueFactory = createIssueFactory(CODE_TYPE, MESSAGE_STRING_TYPE, options, TYPE_STRING);
    this._jsonIssueFactory = createIssueFactory(CODE_JSON, param => param, options);
  }

  /**
   * Prescribes how each value originally produced by parsing is transformed before being returned.
   *
   * @param reviver The reviver callback.
   * @returns The clone of the shape.
   */
  revive(
    /**
     * Prescribes how each value originally produced by parsing is transformed before being returned.
     *
     * @param key The key associated with the value.
     * @param value The value produced by parsing.
     * @returns The transformed value.
     */
    reviver: (this: any, key: string, value: any) => any
  ): this {
    const shape = clone(this);
    shape._reviver = reviver;
    return shape;
  }

  protected _getInputTypes(): ValueType[] {
    return [TYPE_STRING];
  }

  protected _apply(input: unknown, options: ParseOptions): ApplyResult {
    const { _applyChecks } = this;

    let output;
    let issues;

    if (typeof input !== 'string') {
      return this._typeIssueFactory(input, options);
    }
    try {
      output = JSON.parse(input, this._reviver);
    } catch (error: any) {
      return this._jsonIssueFactory(input, options, error.message);
    }
    if (_applyChecks === null || (issues = _applyChecks(output, null, options)) === null) {
      return ok(output);
    }
    return issues;
  }
}
