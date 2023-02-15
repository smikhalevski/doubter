import {
  AnyShape,
  ApplyResult,
  DeepPartialProtocol,
  DeepPartialShape,
  OptionalDeepPartialShape,
  ValueType,
} from './Shape';
import { ConstraintOptions, Message, ParseOptions } from '../shared-types';
import {
  concatIssues,
  copyUnsafeChecks,
  createIssueFactory,
  isArray,
  isEqual,
  isIterable,
  isObjectLike,
  ok,
  toDeepPartialShape,
  unshiftPath,
} from '../utils';
import { CODE_TYPE, MESSAGE_MAP_TYPE, TYPE_ARRAY, TYPE_MAP, TYPE_OBJECT } from '../constants';
import { CoercibleShape } from './CoercibleShape';

/**
 * The shape of a `Map` instance.
 *
 * @template K The key shape.
 * @template V The value shape.
 */
export class MapShape<K extends AnyShape, V extends AnyShape>
  extends CoercibleShape<Map<K['input'], V['input']>, Map<K['output'], V['output']>>
  implements DeepPartialProtocol<MapShape<DeepPartialShape<K>, OptionalDeepPartialShape<V>>>
{
  protected _options;
  protected _typeIssueFactory;

  /**
   * Creates a new {@linkcode MapShape} instance.
   *
   * @param keyShape The key shape.
   * @param valueShape The value shape.
   * @param options The type constraint options or an issue message.
   * @template K The key shape.
   * @template V The value shape.
   */
  constructor(
    /**
     * The key shape.
     */
    readonly keyShape: K,
    /**
     * The value shape.
     */
    readonly valueShape: V,
    options?: ConstraintOptions | Message
  ) {
    super();

    this._options = options;
    this._typeIssueFactory = createIssueFactory(CODE_TYPE, MESSAGE_MAP_TYPE, options, TYPE_MAP);
  }

  at(key: unknown): AnyShape | null {
    return this.valueShape;
  }

  deepPartial(): MapShape<DeepPartialShape<K>, OptionalDeepPartialShape<V>> {
    const keyShape = toDeepPartialShape(this.keyShape);
    const valueShape = toDeepPartialShape(this.valueShape).optional();

    return copyUnsafeChecks(this, new MapShape<any, any>(keyShape, valueShape, this._options));
  }

  protected _requiresAsync(): boolean {
    return this.keyShape.async || this.valueShape.async;
  }

  protected _getInputTypes(): readonly ValueType[] {
    if (this._coerced) {
      return [TYPE_OBJECT, TYPE_ARRAY];
    } else {
      return [TYPE_OBJECT];
    }
  }

  protected _apply(input: any, options: ParseOptions): ApplyResult<Map<K['output'], V['output']>> {
    let changed = false;
    let entries;

    if (
      // Not a Map
      !(input instanceof Map && (entries = Array.from(input.entries()))) &&
      // No coercion or not coercible
      (!(options.coerced || this._coerced) || !(changed = (entries = this._coerceEntries(input)) !== null))
    ) {
      return this._typeIssueFactory(input, options);
    }

    const { keyShape, valueShape, _applyChecks, _unsafe } = this;
    const entriesLength = entries.length;

    let issues = null;

    for (let i = 0; i < entriesLength; ++i) {
      const [key, value] = entries[i];

      let outputKey = key;
      let outputValue = value;

      const keyResult = keyShape['_apply'](key, options);

      if (keyResult !== null) {
        if (isArray(keyResult)) {
          unshiftPath(keyResult, key);

          if (!options.verbose) {
            return keyResult;
          }
          issues = concatIssues(issues, keyResult);
        } else {
          outputKey = keyResult.value;
        }
      }

      const valueResult = valueShape['_apply'](value, options);

      if (valueResult !== null) {
        if (isArray(valueResult)) {
          unshiftPath(valueResult, key);

          if (!options.verbose) {
            return valueResult;
          }
          issues = concatIssues(issues, valueResult);
        } else {
          outputValue = valueResult.value;
        }
      }

      if ((_unsafe || issues === null) && (!isEqual(key, outputKey) || !isEqual(value, outputValue))) {
        changed = true;
        entries[i] = [outputKey, outputValue];
      }
    }

    const output = changed ? new Map(entries) : input;

    if (_applyChecks !== null && (_unsafe || issues === null)) {
      issues = _applyChecks(output, issues, options);
    }
    if (changed && issues === null) {
      return ok(output);
    }
    return issues;
  }

  protected _applyAsync(input: any, options: ParseOptions): Promise<ApplyResult<Map<K['output'], V['output']>>> {
    return new Promise(resolve => {
      let changed = false;
      let entries: [unknown, unknown][] | null;

      if (
        // Not a Map
        !(input instanceof Map && (entries = Array.from(input.entries()))) &&
        // No coercion or not coercible
        (!(options.coerced || this._coerced) || !(changed = (entries = this._coerceEntries(input)) !== null))
      ) {
        resolve(this._typeIssueFactory(input, options));
        return;
      }

      const { keyShape, valueShape, _applyChecks, _unsafe } = this;
      const entriesLength = entries.length;
      const promises: any[] = [];

      for (let i = 0; i < entriesLength; ++i) {
        const [key, value] = entries[i];

        promises.push(keyShape['_applyAsync'](key, options), valueShape['_applyAsync'](value, options));
      }

      resolve(
        Promise.all(promises).then(results => {
          let issues = null;

          for (let i = 0; i < entriesLength; ++i) {
            const [key, value] = entries![i];

            let outputKey = key;
            let outputValue = value;

            const keyResult = results[i * 2];
            const valueResult = results[i * 2 + 1];

            if (keyResult !== null) {
              if (isArray(keyResult)) {
                unshiftPath(keyResult, key);

                if (!options.verbose) {
                  return keyResult;
                }
                issues = concatIssues(issues, keyResult);
              } else {
                outputKey = keyResult.value;
              }
            }

            if (valueResult !== null) {
              if (isArray(valueResult)) {
                unshiftPath(valueResult, key);

                if (!options.verbose) {
                  return valueResult;
                }
                issues = concatIssues(issues, valueResult);
              } else {
                outputValue = valueResult.value;
              }
            }

            if ((_unsafe || issues === null) && (!isEqual(key, outputKey) || !isEqual(value, outputValue))) {
              changed = true;
              entries![i] = [outputKey, outputValue];
            }
          }

          const output = changed ? new Map(entries) : input;

          if (_applyChecks !== null && (_unsafe || issues === null)) {
            issues = _applyChecks(output, issues, options);
          }
          if (changed && issues === null) {
            return ok(output);
          }
          return issues;
        })
      );
    });
  }

  /**
   * Coerces value to a list of `Map` entries, or returns `null` if coercion isn't possible.
   *
   * @param value The non-`Map` value to coerce.
   */
  protected _coerceEntries(value: any): [unknown, unknown][] | null {
    if (isArray(value)) {
      return value.every(isEntry) ? value : null;
    }
    if (isIterable(value)) {
      value = Array.from(value);

      return value.every(isEntry) ? value : null;
    }
    if (isObjectLike(value)) {
      return Object.entries(value);
    }
    return null;
  }
}

function isEntry(value: unknown): value is [unknown, unknown] {
  return isArray(value) && value.length === 2;
}
