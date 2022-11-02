import { AnyShape, Shape } from './Shape';
import { ApplyResult, Issue, Message, ParseOptions, TypeConstraintOptions } from '../shared-types';
import { cloneEnumerableKeys, concatIssues, createCheckConfig, ok, raiseIssue, unshiftPath } from '../shape-utils';
import { CODE_TYPE, MESSAGE_OBJECT_TYPE, TYPE_OBJECT } from './constants';
import { isArray, isEqual, isObjectLike } from '../lang-utils';

export type InferRecord<K extends PropertyKey, V> = undefined extends V
  ? Partial<Record<NonNullable<K>, V>>
  : Record<NonNullable<K>, V>;

export class RecordShape<K extends Shape<string, PropertyKey>, V extends AnyShape> extends Shape<
  InferRecord<K['input'], V['input']>,
  InferRecord<K['output'], V['output']>
> {
  protected _typeCheckConfig;

  constructor(readonly keyShape: K, readonly valueShape: V, options?: TypeConstraintOptions | Message) {
    super(false);
    this._typeCheckConfig = createCheckConfig(options, CODE_TYPE, MESSAGE_OBJECT_TYPE, TYPE_OBJECT);
  }

  at(key: unknown): AnyShape | null {
    return typeof key === 'string' ? this.valueShape : null;
  }

  apply(input: unknown, options: ParseOptions): ApplyResult<InferRecord<K['output'], V['output']>> {
    if (!isObjectLike(input)) {
      return raiseIssue(this._typeCheckConfig, input);
    }

    const { keyShape, valueShape, applyChecks, unsafe } = this;

    let keyCount = 0;
    let issues: Issue[] | null = null;
    let output = input;

    for (const key in input) {
      const value = input[key];

      let outputKey: PropertyKey = key;
      let outputValue = value;

      const keyResult = keyShape.apply(key, options);
      const valueResult = valueShape.apply(value, options);

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

      if ((unsafe || issues === null) && (key !== outputKey || !isEqual(value, outputValue))) {
        if (input === output) {
          output = cloneEnumerableKeys(input, keyCount);
        }

        output[outputKey as string] = outputValue;
      }
    }

    if (applyChecks !== null && (unsafe || issues === null)) {
      issues = applyChecks(output, issues, options);
    }
    if (issues === null && input !== output) {
      return ok(output as InferRecord<K['output'], V['output']>);
    }
    return issues;
  }

  applyAsync(input: unknown, options: ParseOptions): Promise<ApplyResult<InferRecord<K['output'], V['output']>>> {
    return new Promise(resolve => {
      if (!isObjectLike(input)) {
        return raiseIssue(this._typeCheckConfig, input);
      }

      const { keyShape, valueShape, applyChecks, unsafe } = this;

      const promises: any[] = [];

      for (const key in input) {
        promises.push(key, keyShape.applyAsync(key, options), valueShape.applyAsync(key, options));
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

            if ((unsafe || issues === null) && (key !== outputKey || !isEqual(value, outputValue))) {
              if (input === output) {
                output = cloneEnumerableKeys(input, keyCount);
              }

              output[outputKey as string] = outputValue;
            }
          }

          if (applyChecks !== null && (unsafe || issues === null)) {
            issues = applyChecks(output, issues, options);
          }
          if (issues === null && input !== output) {
            return ok(output as InferRecord<K['output'], V['output']>);
          }
          return issues;
        })
      );
    });
  }
}
