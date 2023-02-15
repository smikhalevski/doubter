import { AnyShape, ApplyResult, DeepPartialProtocol, OptionalDeepPartialShape, Shape, ValueType } from './Shape';
import { ConstraintOptions, Message, ParseOptions } from '../shared-types';
import {
  cloneObjectEnumerableKeys,
  concatIssues,
  copyUnsafeChecks,
  createIssueFactory,
  isArray,
  isEqual,
  isObjectLike,
  ok,
  setKeyValue,
  toDeepPartialShape,
  unshiftPath,
} from '../utils';
import { CODE_TYPE, MESSAGE_OBJECT_TYPE, TYPE_OBJECT } from '../constants';

// prettier-ignore
export type InferRecord<K extends Shape<string, PropertyKey> | null, V extends AnyShape, C extends 'input' | 'output'> =
  undefined extends V[C]
    ? Partial<Record<K extends Shape ? K[C] : string, V[C]>>
    : Record<K extends Shape ? K[C] : string, V[C]>;

/**
 * The shape that describes an object with string keys and values that conform the given shape.
 *
 * @template K The key shape.
 * @template V The value shape.
 */
export class RecordShape<K extends Shape<string, PropertyKey> | null, V extends AnyShape>
  extends Shape<InferRecord<K, V, 'input'>, InferRecord<K, V, 'output'>>
  implements DeepPartialProtocol<RecordShape<K, OptionalDeepPartialShape<V>>>
{
  protected _options;
  protected _typeIssueFactory;

  /**
   * Creates a new {@linkcode RecordShape} instance.
   *
   * @param keyShape The key shape, or `null` if keys should be preserved intact.
   * @param valueShape The value shape.
   * @param options The type constraint options or an issue message.
   * @template K The key shape.
   * @template V The value shape.
   */
  constructor(
    /**
     * The key shape or `null` if keys are preserved intact.
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
    this._typeIssueFactory = createIssueFactory(CODE_TYPE, MESSAGE_OBJECT_TYPE, options, TYPE_OBJECT);
  }

  at(key: unknown): AnyShape | null {
    return typeof key === 'string' || typeof key === 'number' ? this.valueShape : null;
  }

  deepPartial(): RecordShape<K, OptionalDeepPartialShape<V>> {
    const valueShape = toDeepPartialShape(this.valueShape).optional();

    return copyUnsafeChecks(this, new RecordShape<any, any>(this.keyShape, valueShape, this._options));
  }

  protected _requiresAsync(): boolean {
    return (this.keyShape !== null && this.keyShape.async) || this.valueShape.async;
  }

  protected _getInputTypes(): readonly ValueType[] {
    return [TYPE_OBJECT];
  }

  protected _apply(input: any, options: ParseOptions): ApplyResult<InferRecord<K, V, 'output'>> {
    if (!isObjectLike(input)) {
      return this._typeIssueFactory(input, options);
    }

    const { keyShape, valueShape, _applyChecks, _unsafe } = this;

    let keyCount = 0;
    let issues = null;
    let output = input;

    for (const key in input) {
      const value = input[key];

      let outputKey: PropertyKey = key;
      let outputValue = value;

      if (keyShape !== null) {
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

      if ((_unsafe || issues === null) && (key !== outputKey || !isEqual(value, outputValue))) {
        if (input === output) {
          output = cloneObjectEnumerableKeys(input, keyCount);
        }
        setKeyValue(output, outputKey, outputValue);
      }
    }

    if (_applyChecks !== null && (_unsafe || issues === null)) {
      issues = _applyChecks(output, issues, options);
    }
    if (issues === null && input !== output) {
      return ok(output as InferRecord<K, V, 'output'>);
    }
    return issues;
  }

  protected _applyAsync(input: any, options: ParseOptions): Promise<ApplyResult<InferRecord<K, V, 'output'>>> {
    return new Promise(resolve => {
      if (!isObjectLike(input)) {
        resolve(this._typeIssueFactory(input, options));
        return;
      }

      const { keyShape, valueShape, _applyChecks, _unsafe } = this;

      const promises: any[] = [];

      for (const key in input) {
        const value = input[key];

        promises.push(
          key,
          keyShape !== null ? keyShape['_applyAsync'](key, options) : null,
          valueShape['_applyAsync'](value, options)
        );
      }

      resolve(
        Promise.all(promises).then(results => {
          const resultsLength = results.length;

          let keyCount = 0;
          let issues = null;
          let output = input;

          for (let i = 0; i < resultsLength; i += 3) {
            const key = results[i];
            const value = input[key];

            let outputKey: PropertyKey = key;
            let outputValue = value;

            const keyResult = results[i + 1];
            const valueResult = results[i + 2];

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

            if ((_unsafe || issues === null) && (key !== outputKey || !isEqual(value, outputValue))) {
              if (input === output) {
                output = cloneObjectEnumerableKeys(input, keyCount);
              }

              output[outputKey as string] = outputValue;
            }
          }

          if (_applyChecks !== null && (_unsafe || issues === null)) {
            issues = _applyChecks(output, issues, options);
          }
          if (issues === null && input !== output) {
            return ok(output as InferRecord<K, V, 'output'>);
          }
          return issues;
        })
      );
    });
  }
}
