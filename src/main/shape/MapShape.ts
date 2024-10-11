import { coerceToMapEntries } from '../coerce/map';
import { NEVER } from '../coerce/never';
import { CODE_TYPE_MAP, MESSAGE_TYPE_MAP } from '../constants';
import { isArray } from '../internal/lang';
import { applyShape, concatIssues, toDeepPartialShape, unshiftIssuesPath } from '../internal/shapes';
import { Type } from '../Type';
import { Issue, IssueOptions, Message, ParseOptions, Result } from '../types';
import { createIssue } from '../utils';
import {
  AnyShape,
  DeepPartialProtocol,
  DeepPartialShape,
  Input,
  OptionalDeepPartialShape,
  Output,
  Shape,
} from './Shape';
import { ReadonlyShape } from './ReadonlyShape';

const mapInputs = Object.freeze<unknown[]>([Type.MAP]);
const mapCoercibleInputs = Object.freeze<unknown[]>([Type.MAP, Type.OBJECT, Type.ARRAY]);

/**
 * The shape of a {@link !Map} instance.
 *
 * @template KeyShape The key shape.
 * @template ValueShape The value shape.
 * @group Shapes
 */
export class MapShape<KeyShape extends AnyShape, ValueShape extends AnyShape>
  extends Shape<Map<Input<KeyShape>, Input<ValueShape>>, Map<Output<KeyShape>, Output<ValueShape>>>
  implements DeepPartialProtocol<MapShape<DeepPartialShape<KeyShape>, OptionalDeepPartialShape<ValueShape>>>
{
  /**
   * The issue options or the issue message.
   */
  protected _options;

  /**
   * Coerces an input value to an array of {@link !Map} entries.
   *
   * @param input The input value to coerce.
   * @returns The coerced value, or {@link NEVER} if coercion isn't possible.
   */
  protected _applyCoerce?: (input: unknown) => [unknown, unknown][] = undefined;

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
    super();

    this._options = options;
  }

  /**
   * `true` if this shape coerces input values to the required type during parsing, or `false` otherwise.
   */
  get isCoercing() {
    return this._applyCoerce !== undefined;
  }

  at(_key: unknown): AnyShape | null {
    return this.valueShape;
  }

  deepPartial(): MapShape<DeepPartialShape<KeyShape>, OptionalDeepPartialShape<ValueShape>> {
    const keyShape = toDeepPartialShape(this.keyShape);

    const valueShape = toDeepPartialShape(this.valueShape).optional();

    return new MapShape<any, any>(keyShape, valueShape, this._options);
  }

  /**
   * Marks a {@link !Map} as readonly.
   *
   * **Note:** This doesn't have any effect at runtime.
   */
  readonly(): ReadonlyShape<this> {
    return new ReadonlyShape(this);
  }

  /**
   * Enables an input value coercion.
   *
   * @returns The clone of the shape.
   */
  coerce(): this {
    const shape = this._clone();
    shape._applyCoerce = coerceToMapEntries;
    return shape;
  }

  protected _isAsync(): boolean {
    return this.keyShape.isAsync || this.valueShape.isAsync;
  }

  protected _getInputs(): readonly unknown[] {
    return this.isCoercing ? mapCoercibleInputs : mapInputs;
  }

  protected _apply(
    input: any,
    options: ParseOptions,
    nonce: number
  ): Result<Map<Output<KeyShape>, Output<ValueShape>>> {
    let isChanged = false;
    let entries;

    if (
      // Not a Map
      !(input instanceof Map && (entries = Array.from(input))) &&
      // No coercion or not coercible
      (this._applyCoerce === undefined || !(isChanged = (entries = this._applyCoerce(input)) !== NEVER))
    ) {
      return [createIssue(CODE_TYPE_MAP, input, MESSAGE_TYPE_MAP, undefined, options, this._options)];
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
        isChanged = true;
        entry[0] = key;
        entry[1] = value;
      }
    }

    return this._applyOperations(input, isChanged ? new Map(entries) : input, options, issues) as Result;
  }

  protected _applyAsync(
    input: any,
    options: ParseOptions,
    nonce: number
  ): Promise<Result<Map<Output<KeyShape>, Output<ValueShape>>>> {
    return new Promise(resolve => {
      let isChanged = false;
      let entries;

      if (
        // Not a Map
        !(input instanceof Map && (entries = Array.from(input))) &&
        // No coercion or not coercible
        (this._applyCoerce === undefined || !(isChanged = (entries = this._applyCoerce(input)) !== NEVER))
      ) {
        resolve([createIssue(CODE_TYPE_MAP, input, MESSAGE_TYPE_MAP, undefined, options, this._options)]);
        return;
      }

      const { keyShape, valueShape, operations } = this;
      const entriesLength = entries.length;

      let issues: Issue[] | null = null;
      let index = -1;

      let entry: [unknown, unknown];
      let key: unknown;
      let value: unknown;
      let isKeyChanged = false;

      const handleKeyResult = (keyResult: Result) => {
        isKeyChanged = false;

        if (keyResult !== null) {
          if (isArray(keyResult)) {
            unshiftIssuesPath(keyResult, key);

            if (options.earlyReturn) {
              return keyResult;
            }
            issues = concatIssues(issues, keyResult);
          } else {
            key = keyResult.value;
            isKeyChanged = true;
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

        if ((issues === null || operations.length !== 0) && (isKeyChanged || valueResult !== null)) {
          isChanged = true;
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

        return this._applyOperations(input, isChanged ? new Map(entries) : input, options, issues);
      };

      resolve(next());
    });
  }
}
