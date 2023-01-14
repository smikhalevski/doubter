import { AnyShape, ValueType } from './Shape';
import { ApplyResult, Issue, Message, ParseOptions, TypeConstraintOptions } from '../shared-types';
import { concatIssues, createIssueFactory, isArray, isEqual, isObjectLike, ok, unshiftPath } from '../utils';
import { CODE_TYPE, MESSAGE_MAP_TYPE, TYPE_ARRAY, TYPE_MAP, TYPE_OBJECT } from '../constants';
import { CoercibleShape } from './CoercibleShape';

/**
 * The shape of a `Map` instance.
 *
 * @template K The key shape.
 * @template V The value shape.
 */
export class MapShape<K extends AnyShape, V extends AnyShape> extends CoercibleShape<
  Map<K['input'], V['input']>,
  Map<K['output'], V['output']>
> {
  protected _issueFactory;

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
    options?: TypeConstraintOptions | Message
  ) {
    super();

    this._issueFactory = createIssueFactory(CODE_TYPE, MESSAGE_MAP_TYPE, options, TYPE_MAP);
  }

  at(key: unknown): AnyShape | null {
    return this.valueShape;
  }

  protected _requiresAsync(): boolean {
    return this.keyShape.async || this.valueShape.async;
  }

  protected _getInputTypes(): ValueType[] {
    if (this._coerced) {
      return [TYPE_OBJECT, TYPE_ARRAY];
    } else {
      return [TYPE_OBJECT];
    }
  }

  protected _apply(input: unknown, options: ParseOptions): ApplyResult<Map<K['output'], V['output']>> {
    let entries: [unknown, unknown][];
    let changed = false;

    if (input instanceof Map) {
      entries = Array.from(input);
    } else {
      if (!(options.coerced || this._coerced)) {
        return this._issueFactory(input, options);
      }
      if (isObjectLike(input)) {
        changed = true;
        entries = Object.entries(input);
      } else if (isArray(input) && input.every(isMapEntry)) {
        changed = true;
        entries = input;
      } else {
        return this._issueFactory(input, options);
      }
    }

    const { keyShape, valueShape, _applyChecks, _unsafe } = this;
    const entriesLength = entries.length;

    let issues: Issue[] | null = null;

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
        entries[i] = [outputKey, outputValue];
      }
    }

    const output = changed ? new Map(entries) : input;

    if (_applyChecks !== null && (_unsafe || issues === null)) {
      issues = _applyChecks(output, issues, options);
    }
    if (issues === null && changed) {
      return ok(output as Map<K['output'], V['output']>);
    }
    return issues;
  }

  protected _applyAsync(input: unknown, options: ParseOptions): Promise<ApplyResult<Map<K['output'], V['output']>>> {
    return new Promise(resolve => {
      let entries: [unknown, unknown][];
      let changed = false;

      if (input instanceof Map) {
        entries = Array.from(input);
      } else {
        if (!(options.coerced || this._coerced)) {
          return this._issueFactory(input, options);
        }
        if (isObjectLike(input)) {
          changed = true;
          entries = Object.entries(input);
        } else if (isArray(input) && input.every(isMapEntry)) {
          changed = true;
          entries = input;
        } else {
          return this._issueFactory(input, options);
        }
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
          let issues: Issue[] | null = null;

          for (let i = 0; i < entriesLength; ++i) {
            const [key, value] = entries[i];

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
              entries[i] = [outputKey, outputValue];
            }
          }

          const output = changed ? new Map(entries) : input;

          if (_applyChecks !== null && (_unsafe || issues === null)) {
            issues = _applyChecks(output, issues, options);
          }
          if (issues === null && changed) {
            return ok(output as Map<K['output'], V['output']>);
          }
          return issues;
        })
      );
    });
  }
}

function isMapEntry(value: unknown): boolean {
  return isArray(value) && value.length === 2;
}
