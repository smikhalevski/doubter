import { Shape, ValueType } from './Shape';
import { ApplyResult, Message, ParseOptions, TypeConstraintOptions } from '../shared-types';
import { clone, createIssueFactory, ok } from '../utils';
import { CODE_JSON, MESSAGE_JSON, TYPE_STRING } from '../constants';

/**
 * The shape of a value deserialized from a JSON string.
 */
export class JSONShape extends Shape<string, any> {
  protected _issueFactory;
  protected _reviver?: (this: any, key: string, value: any) => any;

  /**
   * Creates a new {@linkcode JSONShape} instance.
   *
   * @param options The type constraint options or the type issue message.
   */
  constructor(options?: TypeConstraintOptions | Message) {
    super();

    this._issueFactory = createIssueFactory(CODE_JSON, MESSAGE_JSON, options);
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
      return this._issueFactory(input, options, undefined);
    }

    try {
      output = JSON.parse(input, this._reviver);
    } catch (error) {
      return this._issueFactory(input, options, error);
    }

    if (_applyChecks !== null) {
      issues = _applyChecks(output, null, options);

      if (issues !== null) {
        return issues;
      }
    }
    return ok(output);
  }
}
