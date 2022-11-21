import { AnyShape, Shape } from './Shape';
import { ApplyResult, Issue, Message, ParseOptions, TypeConstraintOptions } from '../shared-types';
import {
  cloneEnumerableKeys,
  concatIssues,
  createIssueFactory,
  isArray,
  isEqual,
  isObjectLike,
  objectTypes,
  ok,
  setKeyValue,
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
export class RecordShape<K extends Shape<string, PropertyKey> | null, V extends AnyShape> extends Shape<
  InferRecord<K, V, 'input'>,
  InferRecord<K, V, 'output'>
> {
  protected _typeIssueFactory;

  /**
   * Creates a new {@linkcode RecordShape} instance.
   *
   * @param keyShape The key shape.
   * @param valueShape The value shape.
   * @param options The type constraint options or an issue message.
   * @template K The key shape or `null` if keys should be preserved intact.
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
    options?: TypeConstraintOptions | Message
  ) {
    super(objectTypes, (keyShape != null && keyShape.async) || valueShape.async);

    this._typeIssueFactory = createIssueFactory(CODE_TYPE, MESSAGE_OBJECT_TYPE, options, TYPE_OBJECT);
  }

  at(key: unknown): AnyShape | null {
    return typeof key === 'string' || typeof key === 'number' ? this.valueShape : null;
  }

  apply(input: unknown, options: ParseOptions): ApplyResult<InferRecord<K, V, 'output'>> {
    if (!isObjectLike(input)) {
      return [this._typeIssueFactory(input, options)];
    }

    const { keyShape, valueShape, _applyChecks, _unsafe } = this;

    let keyCount = 0;
    let issues: Issue[] | null = null;
    let output = input;

    for (const key in input) {
      const value = input[key];

      let outputKey: PropertyKey = key;
      let outputValue = value;

      if (keyShape !== null) {
        const keyResult = keyShape.apply(key, options);

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

      const valueResult = valueShape.apply(value, options);

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
          output = cloneEnumerableKeys(input, keyCount);
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

  applyAsync(input: unknown, options: ParseOptions): Promise<ApplyResult<InferRecord<K, V, 'output'>>> {
    if (!this.async) {
      return super.applyAsync(input, options);
    }

    return new Promise(resolve => {
      if (!isObjectLike(input)) {
        resolve([this._typeIssueFactory(input, options)]);
        return;
      }

      const { keyShape, valueShape, _applyChecks, _unsafe } = this;

      const promises: any[] = [];

      for (const key in input) {
        const value = input[key];

        promises.push(
          key,
          keyShape !== null ? keyShape.applyAsync(key, options) : null,
          valueShape.applyAsync(value, options)
        );
      }

      resolve(
        Promise.all(promises).then(results => {
          const resultsLength = results.length;

          let keyCount = 0;
          let issues: Issue[] | null = null;
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
                output = cloneEnumerableKeys(input, keyCount);
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
