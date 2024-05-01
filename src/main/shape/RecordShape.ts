import { CODE_TYPE_OBJECT, MESSAGE_TYPE_OBJECT } from '../constants';
import { isArray, isObject } from '../internal/lang';
import { cloneDictHead, setObjectProperty } from '../internal/objects';
import { applyShape, concatIssues, INPUT, OUTPUT, toDeepPartialShape, unshiftIssuesPath } from '../internal/shapes';
import { Type } from '../Type';
import { Issue, IssueOptions, Message, ParseOptions, Result } from '../types';
import { createIssue } from '../utils';
import { AnyShape, DeepPartialProtocol, OptionalDeepPartialShape, Shape } from './Shape';

const recordInputs = Object.freeze([Type.OBJECT]);

export const defaultKeyShape = new Shape();

/**
 * The shape that describes an object with string keys and values that conform the given shape.
 *
 * @template KeysShape The shape of record keys.
 * @template ValuesShape The shape of record values.
 * @group Shapes
 */
export class RecordShape<KeysShape extends Shape<string, PropertyKey>, ValuesShape extends AnyShape>
  extends Shape<Record<KeysShape[INPUT], ValuesShape[INPUT]>, Record<KeysShape[OUTPUT], ValuesShape[OUTPUT]>>
  implements DeepPartialProtocol<RecordShape<KeysShape, OptionalDeepPartialShape<ValuesShape>>>
{
  /**
   * The issue options or the issue message.
   */
  protected _options;

  /**
   * Creates a new {@link RecordShape} instance.
   *
   * @param keysShape The shape of record keys.
   * @param valuesShape The shape of record values.
   * @param options The issue options or the issue message.
   * @template KeysShape The shape of record keys.
   * @template ValuesShape The shape of record values.
   */
  constructor(
    /**
     * The shape of record keys.
     */
    readonly keysShape: KeysShape,
    /**
     * The shape of record values.
     */
    readonly valuesShape: ValuesShape,
    options?: IssueOptions | Message
  ) {
    super();

    this._options = options;
  }

  at(key: unknown): AnyShape | null {
    return typeof key === 'string' || typeof key === 'number' ? this.valuesShape : null;
  }

  deepPartial(): RecordShape<KeysShape, OptionalDeepPartialShape<ValuesShape>> {
    return new RecordShape<any, any>(this.keysShape, toDeepPartialShape(this.valuesShape).optional(), this._options);
  }

  protected _isAsync(): boolean {
    return this.keysShape?.isAsync || this.valuesShape.isAsync;
  }

  protected _getInputs(): readonly unknown[] {
    return recordInputs;
  }

  protected _apply(
    input: any,
    options: ParseOptions,
    nonce: number
  ): Result<Record<KeysShape[OUTPUT], ValuesShape[OUTPUT]>> {
    if (!isObject(input)) {
      return [createIssue(CODE_TYPE_OBJECT, input, MESSAGE_TYPE_OBJECT, undefined, options, this._options)];
    }

    const { keysShape, valuesShape, operations } = this;

    let output = input;
    let issues = null;
    let index = -1;

    for (let key in input) {
      let value = input[key];
      let keyResult = null;

      index++;

      if (keysShape !== defaultKeyShape) {
        keyResult = keysShape['_apply'](key, options, nonce);

        if (keyResult !== null) {
          if (isArray(keyResult)) {
            unshiftIssuesPath(keyResult, key);

            if (options.earlyReturn) {
              return keyResult;
            }
            issues = concatIssues(issues, keyResult);
            keyResult = null;
          } else {
            key = keyResult.value as string;
          }
        }
      }

      let valueResult = valuesShape['_apply'](value, options, nonce);

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
        if (input === output) {
          output = cloneDictHead(input, index);
        }
        setObjectProperty(output, key, value);
      }
    }
    return this._applyOperations(input, output, options, issues) as Result;
  }

  protected _applyAsync(
    input: any,
    options: ParseOptions,
    nonce: number
  ): Promise<Result<Record<KeysShape[OUTPUT], ValuesShape[OUTPUT]>>> {
    return new Promise(resolve => {
      if (!isObject(input)) {
        resolve([createIssue(CODE_TYPE_OBJECT, input, MESSAGE_TYPE_OBJECT, undefined, options, this._options)]);
        return;
      }

      const { keysShape, valuesShape, operations } = this;

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

            if (options.earlyReturn) {
              return keyResult;
            }
            issues = concatIssues(issues, keyResult);
          } else {
            key = keyResult.value;
            keyChanged = true;
          }
        }
        return applyShape(valuesShape, value, options, nonce, handleValueResult);
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

          if (keysShape !== null) {
            return applyShape(keysShape, key, options, nonce, handleKeyResult);
          } else {
            return valuesShape['_applyAsync'](value, options, nonce).then(handleValueResult);
          }
        }
        return this._applyOperations(input, output, options, issues);
      };

      resolve(next());
    });
  }
}
