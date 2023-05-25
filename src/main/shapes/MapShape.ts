import { CODE_TYPE, MESSAGE_MAP_TYPE } from '../constants';
import { TYPE_ARRAY, TYPE_MAP, TYPE_OBJECT } from '../Type';
import { ApplyOptions, ConstraintOptions, Issue, Message } from '../types';
import {
  applyShape,
  concatIssues,
  copyUnsafeChecks,
  createIssueFactory,
  getCanonicalValueOf,
  isArray,
  isIterableObject,
  isMapEntry,
  isObjectLike,
  ok,
  toDeepPartialShape,
  unshiftIssuesPath,
} from '../utils';
import { CoercibleShape } from './CoercibleShape';
import {
  AnyShape,
  DeepPartialProtocol,
  DeepPartialShape,
  INPUT,
  NEVER,
  OptionalDeepPartialShape,
  OUTPUT,
  Result,
} from './Shape';

/**
 * The shape of a `Map` instance.
 *
 * @template KeyShape The key shape.
 * @template ValueShape The value shape.
 */
export class MapShape<KeyShape extends AnyShape, ValueShape extends AnyShape>
  extends CoercibleShape<Map<KeyShape[INPUT], ValueShape[INPUT]>, Map<KeyShape[OUTPUT], ValueShape[OUTPUT]>>
  implements DeepPartialProtocol<MapShape<DeepPartialShape<KeyShape>, OptionalDeepPartialShape<ValueShape>>>
{
  /**
   * The type constraint options or an issue message.
   */
  protected _options;

  /**
   * Returns issues associated with an invalid input value type.
   */
  protected _typeIssueFactory;

  /**
   * Creates a new {@linkcode MapShape} instance.
   *
   * @param keyShape The key shape.
   * @param valueShape The value shape.
   * @param options The type constraint options or an issue message.
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
    options?: ConstraintOptions | Message
  ) {
    super();

    this._options = options;
    this._typeIssueFactory = createIssueFactory(CODE_TYPE, MESSAGE_MAP_TYPE, options, TYPE_MAP);
  }

  at(key: unknown): AnyShape | null {
    return this.valueShape;
  }

  deepPartial(): MapShape<DeepPartialShape<KeyShape>, OptionalDeepPartialShape<ValueShape>> {
    const keyShape = toDeepPartialShape(this.keyShape);
    const valueShape = toDeepPartialShape(this.valueShape).optional();

    return copyUnsafeChecks(this, new MapShape<any, any>(keyShape, valueShape, this._options));
  }

  protected _isAsync(): boolean {
    return this.keyShape.isAsync || this.valueShape.isAsync;
  }

  protected _getInputs(): unknown[] {
    if (this.isCoerced) {
      return [TYPE_MAP, TYPE_OBJECT, TYPE_ARRAY];
    } else {
      return [TYPE_MAP];
    }
  }

  protected _apply(input: any, options: ApplyOptions): Result<Map<KeyShape[OUTPUT], ValueShape[OUTPUT]>> {
    let changed = false;
    let entries;

    if (
      // Not a Map
      !(input instanceof Map && (entries = Array.from(input))) &&
      // No coercion or not coercible
      (!(options.coerced || this.isCoerced) || !(changed = (entries = this._coerceEntries(input)) !== NEVER))
    ) {
      return this._typeIssueFactory(input, options);
    }

    const { keyShape, valueShape, _applyChecks, _isUnsafe } = this;
    const entriesLength = entries.length;

    let issues = null;

    for (let i = 0; i < entriesLength; ++i) {
      const entry = entries[i];

      let [key, value] = entry;

      let keyResult = keyShape['_apply'](key, options);

      if (keyResult !== null) {
        if (isArray(keyResult)) {
          unshiftIssuesPath(keyResult, key);

          if (!options.verbose) {
            return keyResult;
          }
          issues = concatIssues(issues, keyResult);
          keyResult = null;
        } else {
          key = keyResult.value;
        }
      }

      let valueResult = valueShape['_apply'](value, options);

      if (valueResult !== null) {
        if (isArray(valueResult)) {
          unshiftIssuesPath(valueResult, key);

          if (!options.verbose) {
            return valueResult;
          }
          issues = concatIssues(issues, valueResult);
          valueResult = null;
        } else {
          value = valueResult.value;
        }
      }

      if ((_isUnsafe || issues === null) && (keyResult !== null || valueResult !== null)) {
        changed = true;
        entry[0] = key;
        entry[1] = value;
      }
    }

    const output = changed ? new Map(entries) : input;

    if (_applyChecks !== null && (_isUnsafe || issues === null)) {
      issues = _applyChecks(output, issues, options);
    }
    if (changed && issues === null) {
      return ok(output);
    }
    return issues;
  }

  protected _applyAsync(input: any, options: ApplyOptions): Promise<Result<Map<KeyShape[OUTPUT], ValueShape[OUTPUT]>>> {
    return new Promise(resolve => {
      let changed = false;
      let entries: [unknown, unknown][];

      if (
        // Not a Map
        !(input instanceof Map && (entries = Array.from(input))) &&
        // No coercion or not coercible
        (!(options.coerced || this.isCoerced) || !(changed = (entries = this._coerceEntries(input)) !== NEVER))
      ) {
        resolve(this._typeIssueFactory(input, options));
        return;
      }

      const { keyShape, valueShape, _applyChecks, _isUnsafe } = this;
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

            if (!options.verbose) {
              return keyResult;
            }
            issues = concatIssues(issues, keyResult);
          } else {
            key = keyResult.value;
            keyChanged = true;
          }
        }
        return applyShape(valueShape, value, options, handleValueResult);
      };

      const handleValueResult = (valueResult: Result) => {
        if (valueResult !== null) {
          if (isArray(valueResult)) {
            unshiftIssuesPath(valueResult, key);

            if (!options.verbose) {
              return valueResult;
            }
            issues = concatIssues(issues, valueResult);
            valueResult = null;
          } else {
            value = valueResult.value;
          }
        }

        if ((_isUnsafe || issues === null) && (keyChanged || valueResult !== null)) {
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

          return applyShape(keyShape, key, options, handleKeyResult);
        }

        const output = changed ? new Map(entries) : input;

        if (_applyChecks !== null && (_isUnsafe || issues === null)) {
          issues = _applyChecks(output, issues, options);
        }
        if (changed && issues === null) {
          return ok(output);
        }
        return issues;
      };

      resolve(next());
    });
  }

  /**
   * Coerces a value to an array of `Map` entries, or returns {@linkcode NEVER} if coercion isn't possible.
   *
   * @param value A non-`Map` value to coerce.
   */
  protected _coerceEntries(value: any): [unknown, unknown][] {
    if (isArray(value)) {
      return value.every(isMapEntry) ? value : NEVER;
    }

    value = getCanonicalValueOf(value);

    if (isIterableObject(value)) {
      value = Array.from(value);

      return value.every(isMapEntry) ? value : NEVER;
    }
    if (isObjectLike(value)) {
      return Object.entries(value);
    }
    return NEVER;
  }
}
