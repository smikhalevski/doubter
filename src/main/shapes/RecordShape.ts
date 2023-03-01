import { AnyShape, DeepPartialProtocol, OptionalDeepPartialShape, Result, Shape, ValueType } from './Shape';
import { ConstraintOptions, Issue, Message, ParseOptions } from '../shared-types';
import {
  callApply,
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

  protected _isAsync(): boolean {
    return this.keyShape?.isAsync || this.valueShape.isAsync;
  }

  protected _getInputTypes(): readonly ValueType[] {
    return [TYPE_OBJECT];
  }

  protected _apply(input: any, options: ParseOptions): Result<InferRecord<K, V, 'output'>> {
    if (!isObjectLike(input)) {
      return this._typeIssueFactory(input, options);
    }

    const { keyShape, valueShape, _applyChecks, _isUnsafe } = this;

    let output = input;
    let issues = null;
    let index = -1;

    for (const key in input) {
      const value = input[key];

      let outputKey: PropertyKey = key;
      let outputValue = value;

      index++;

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

      if ((_isUnsafe || issues === null) && (key !== outputKey || !isEqual(value, outputValue))) {
        if (input === output) {
          output = cloneObjectEnumerableKeys(input, index);
        }
        setKeyValue(output, outputKey, outputValue);
      }
    }

    if (_applyChecks !== null && (_isUnsafe || issues === null)) {
      issues = _applyChecks(output, issues, options);
    }
    if (issues === null && input !== output) {
      return ok(output);
    }
    return issues;
  }

  protected _applyAsync(input: any, options: ParseOptions): Promise<Result<InferRecord<K, V, 'output'>>> {
    return new Promise(resolve => {
      if (!isObjectLike(input)) {
        resolve(this._typeIssueFactory(input, options));
        return;
      }

      const { keyShape, valueShape, _applyChecks, _isUnsafe } = this;

      const keys = Object.keys(input);
      const keysLength = keys.length;

      let output = input;
      let issues: Issue[] | null = null;
      let index = -1;

      let key: string;
      let value: unknown;
      let outputKey: string;
      let outputValue: unknown;

      const handleKeyResult = (keyResult: Result) => {
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
        return callApply(valueShape, value, options, handleValueResult);
      };

      const handleValueResult = (valueResult: Result) => {
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

        if ((_isUnsafe || issues === null) && (key !== outputKey || !isEqual(value, outputValue))) {
          if (input === output) {
            output = cloneObjectEnumerableKeys(input, index);
          }
          setKeyValue(output, outputKey, outputValue);
        }

        return next();
      };

      const next = (): Result | Promise<Result> => {
        index++;

        if (index !== keysLength) {
          key = outputKey = keys[index];
          value = outputValue = input[key];

          if (keyShape !== null) {
            return callApply(keyShape, key, options, handleKeyResult);
          } else {
            return valueShape['_applyAsync'](value, options).then(handleValueResult);
          }
        }

        if (_applyChecks !== null && (_isUnsafe || issues === null)) {
          issues = _applyChecks(output, issues, options);
        }
        if (issues === null && input !== output) {
          return ok(output);
        }
        return issues;
      };

      resolve(next());
    });
  }
}
