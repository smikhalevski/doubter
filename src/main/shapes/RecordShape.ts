import { CODE_TYPE, MESSAGE_OBJECT_TYPE } from '../constants';
import { ApplyOptions, ConstraintOptions, Issue, Message } from '../types';
import {
  applyShape,
  cloneDictHead,
  concatIssues,
  copyUnsafeChecks,
  createIssueFactory,
  isArray,
  isObject,
  OBJECT,
  ok,
  setObjectProperty,
  toDeepPartialShape,
  unshiftIssuesPath,
} from '../utils';
import { AnyShape, DeepPartialProtocol, OptionalDeepPartialShape, Result, Shape } from './Shape';

// prettier-ignore
export type InferRecord<K extends Shape<string, PropertyKey> | null, V extends AnyShape, C extends 'input' | 'output'> =
  Record<K extends Shape ? K[C] : string, V[C]>;

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
    this._typeIssueFactory = createIssueFactory(CODE_TYPE, MESSAGE_OBJECT_TYPE, options, OBJECT);
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

  protected _getInputTypes(): unknown[] {
    return [OBJECT];
  }

  protected _apply(input: any, options: ApplyOptions): Result<InferRecord<K, V, 'output'>> {
    if (!isObject(input)) {
      return this._typeIssueFactory(input, options);
    }

    const { keyShape, valueShape, _applyChecks, _isUnsafe } = this;

    let output = input;
    let issues = null;
    let index = -1;

    for (let key in input) {
      let value = input[key];
      let keyResult = null;

      index++;

      if (keyShape !== null) {
        keyResult = keyShape['_apply'](key, options);

        if (keyResult !== null) {
          if (isArray(keyResult)) {
            unshiftIssuesPath(keyResult, key);

            if (!options.verbose) {
              return keyResult;
            }
            issues = concatIssues(issues, keyResult);
            keyResult = null;
          } else {
            key = keyResult.value as string;
          }
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
        if (input === output) {
          output = cloneDictHead(input, index);
        }
        setObjectProperty(output, key, value);
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

  protected _applyAsync(input: any, options: ApplyOptions): Promise<Result<InferRecord<K, V, 'output'>>> {
    return new Promise(resolve => {
      if (!isObject(input)) {
        resolve(this._typeIssueFactory(input, options));
        return;
      }

      const { keyShape, valueShape, _applyChecks, _isUnsafe } = this;

      const keys = Object.keys(input);
      const keysLength = keys.length;

      let output = input;
      let issues: Issue[] | null = null;
      let index = -1;

      let key: PropertyKey;
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
          if (input === output) {
            output = cloneDictHead(input, index);
          }
          setObjectProperty(output, key, value);
        }

        return next();
      };

      const next = (): Result | Promise<Result> => {
        index++;

        if (index !== keysLength) {
          key = keys[index];
          value = input[key];

          if (keyShape !== null) {
            return applyShape(keyShape, key, options, handleKeyResult);
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
