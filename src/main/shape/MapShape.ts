import { coerceToMapEntries, mapCoercibleTypes } from '../coerce/map';
import { NEVER } from '../coerce/never';
import { CODE_TYPE } from '../constants';
import { isArray } from '../internal/lang';
import { applyShape, concatIssues, toDeepPartialShape, unshiftIssuesPath } from '../internal/shapes';
import { TYPE_MAP } from '../Type';
import { ApplyOptions, Issue, IssueOptions, Message, Result } from '../types';
import { createIssueFactory } from '../utils';
import { CoercibleShape } from './CoercibleShape';
import { AnyShape, DeepPartialProtocol, DeepPartialShape, Input, OptionalDeepPartialShape, Output } from './Shape';

/**
 * The shape of a {@link !Map Map} instance.
 *
 * @template KeyShape The key shape.
 * @template ValueShape The value shape.
 * @group Shapes
 */
export class MapShape<KeyShape extends AnyShape, ValueShape extends AnyShape>
  extends CoercibleShape<
    Map<Input<KeyShape>, Input<ValueShape>>,
    Map<Output<KeyShape>, Output<ValueShape>>,
    [unknown, unknown][]
  >
  implements DeepPartialProtocol<MapShape<DeepPartialShape<KeyShape>, OptionalDeepPartialShape<ValueShape>>>
{
  /**
   * The issue options or the issue message.
   */
  protected _options;

  /**
   * Returns issues associated with an invalid input value type.
   */
  protected _typeIssueFactory;

  /**
   * Creates a new {@link MapShape} instance.
   *
   * @param keyShape The key shape.
   * @param valueShape The value shape.
   * @param options The issue options or the issue message.
   * @template KeyShape The key shape.
   * @template ValueShape The value shape.
   */
  constructor(
    /**
     * The key shape.
     */
    readonly keyShape: KeyShape,
    /**
     * The value shape.
     */
    readonly valueShape: ValueShape,
    options?: IssueOptions | Message
  ) {
    super(coerceToMapEntries);

    this._options = options;
    this._typeIssueFactory = createIssueFactory(CODE_TYPE, Shape.messages['type.map'], options, TYPE_MAP);
  }

  at(key: unknown): AnyShape | null {
    return this.valueShape;
  }

  deepPartial(): MapShape<DeepPartialShape<KeyShape>, OptionalDeepPartialShape<ValueShape>> {
    const keyShape = toDeepPartialShape(this.keyShape);

    const valueShape = toDeepPartialShape(this.valueShape).optional();

    return new MapShape<any, any>(keyShape, valueShape, this._options);
  }

  protected _isAsync(): boolean {
    return this.keyShape.isAsync || this.valueShape.isAsync;
  }

  protected _getInputs(): readonly unknown[] {
    return [TYPE_MAP];
  }

  protected _getCoercibleInputs(): readonly unknown[] {
    return mapCoercibleTypes;
  }

  protected _apply(
    input: any,
    options: ApplyOptions,
    nonce: number
  ): Result<Map<Output<KeyShape>, Output<ValueShape>>> {
    let changed = false;
    let entries;

    if (
      // Not a Map
      !(input instanceof Map && (entries = Array.from(input))) &&
      // No coercion or not coercible
      !(changed = (entries = this._tryCoerce(input, options.coerce)) !== NEVER)
    ) {
      return [this._typeIssueFactory(input, options)];
    }

    const { keyShape, valueShape, operations } = this;
    const entriesLength = entries.length;

    let issues = null;

    for (let i = 0; i < entriesLength; ++i) {
      const entry = entries[i];

      let [key, value] = entry;

      let keyResult = keyShape['_apply'](key, options, nonce);

      if (keyResult !== null) {
        if (isArray(keyResult)) {
          unshiftIssuesPath(keyResult, key);

          if (options.earlyReturn) {
            return keyResult;
          }
          issues = concatIssues(issues, keyResult);
          keyResult = null;
        } else {
          key = keyResult.value;
        }
      }

      let valueResult = valueShape['_apply'](value, options, nonce);

      if (valueResult !== null) {
        if (isArray(valueResult)) {
          unshiftIssuesPath(valueResult, key);

          if (options.earlyReturn) {
            return valueResult;
          }
          issues = concatIssues(issues, valueResult);
          valueResult = null;
        } else {
          value = valueResult.value;
        }
      }

      if ((issues === null || operations.length !== 0) && (keyResult !== null || valueResult !== null)) {
        changed = true;
        entry[0] = key;
        entry[1] = value;
      }
    }

    return this._applyOperations(input, changed ? new Map(entries) : input, options, issues);
  }

  protected _applyAsync(
    input: any,
    options: ApplyOptions,
    nonce: number
  ): Promise<Result<Map<Output<KeyShape>, Output<ValueShape>>>> {
    return new Promise(resolve => {
      let changed = false;
      let entries: [unknown, unknown][];

      if (
        // Not a Map
        !(input instanceof Map && (entries = Array.from(input))) &&
        // No coercion or not coercible
        !(changed = (entries = this._tryCoerce(input, options.coerce)) !== NEVER)
      ) {
        resolve([this._typeIssueFactory(input, options)]);
        return;
      }

      const { keyShape, valueShape, operations } = this;
      const entriesLength = entries.length;

      let issues: Issue[] | null = null;
      let index = -1;

      let entry: [unknown, unknown];
      let key: unknown;
      let value: unknown;
      let keyChanged = false;

      const handleKeyResult = (keyResult: Result) => {
        keyChanged = false;

        if (keyResult !== null) {
          if (isArray(keyResult)) {
            unshiftIssuesPath(keyResult, key);

            if (options.earlyReturn) {
              return keyResult;
            }
            issues = concatIssues(issues, keyResult);
          } else {
            key = keyResult.value;
            keyChanged = true;
          }
        }
        return applyShape(valueShape, value, options, nonce, handleValueResult);
      };

      const handleValueResult = (valueResult: Result) => {
        if (valueResult !== null) {
          if (isArray(valueResult)) {
            unshiftIssuesPath(valueResult, key);

            if (options.earlyReturn) {
              return valueResult;
            }
            issues = concatIssues(issues, valueResult);
            valueResult = null;
          } else {
            value = valueResult.value;
          }
        }

        if ((issues === null || operations.length !== 0) && (keyChanged || valueResult !== null)) {
          changed = true;
          entry[0] = key;
          entry[1] = value;
        }
        return next();
      };

      const next = (): Result | Promise<Result> => {
        index++;

        if (index !== entriesLength) {
          entry = entries[index];
          key = entry[0];
          value = entry[1];

          return applyShape(keyShape, key, options, nonce, handleKeyResult);
        }

        return this._applyOperations(input, changed ? new Map(entries) : input, options, issues);
      };

      resolve(next());
    });
  }
}
