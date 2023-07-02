import { CODE_TYPE, MESSAGE_OBJECT_TYPE } from '../constants';
import {
  applyShape,
  cloneDictHead,
  concatIssues,
  isArray,
  isObject,
  setObjectProperty,
  toDeepPartialShape,
  unshiftIssuesPath,
} from '../internal';
import { TYPE_OBJECT } from '../Type';
import { ApplyOptions, ConstraintOptions, Issue, Message, Result } from '../types';
import { createIssueFactory } from '../utils';
import { AnyShape, DeepPartialProtocol, INPUT, OptionalDeepPartialShape, OUTPUT, Shape } from './Shape';

type InferRecord<
  KeyShape extends Shape<string, PropertyKey> | null,
  ValueShape extends AnyShape,
  Leg extends INPUT | OUTPUT
> = Record<
  KeyShape extends null | undefined ? string : KeyShape extends Shape ? KeyShape[Leg] : string,
  ValueShape[Leg]
>;

/**
 * The shape that describes an object with string keys and values that conform the given shape.
 *
 * @template KeyShape The kind shape.
 * @template ValueShape The value shape.
 * @group Shapes
 */
export class RecordShape<KeyShape extends Shape<string, PropertyKey> | null, ValueShape extends AnyShape>
  extends Shape<InferRecord<KeyShape, ValueShape, INPUT>, InferRecord<KeyShape, ValueShape, OUTPUT>>
  implements DeepPartialProtocol<RecordShape<KeyShape, OptionalDeepPartialShape<ValueShape>>>
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
   * Creates a new {@linkcode RecordShape} instance.
   *
   * @param keyShape The kind shape, or `null` if keys should be preserved intact.
   * @param valueShape The value shape.
   * @param options The type constraint options or an issue message.
   * @template KeyShape The kind shape.
   * @template ValueShape The value shape.
   */
  constructor(
    /**
     * The kind shape or `null` if keys are preserved intact.
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
    this._typeIssueFactory = createIssueFactory(CODE_TYPE, MESSAGE_OBJECT_TYPE, options, TYPE_OBJECT);
  }

  at(key: unknown): AnyShape | null {
    return typeof key === 'string' || typeof key === 'number' ? this.valueShape : null;
  }

  deepPartial(): RecordShape<KeyShape, OptionalDeepPartialShape<ValueShape>> {
    return new RecordShape<any, any>(this.keyShape, toDeepPartialShape(this.valueShape).optional(), this._options);
  }

  protected _isAsync(): boolean {
    return this.keyShape?.isAsync || this.valueShape.isAsync;
  }

  protected _getInputs(): unknown[] {
    return [TYPE_OBJECT];
  }

  protected _apply(
    input: any,
    options: ApplyOptions,
    nonce: number
  ): Result<InferRecord<KeyShape, ValueShape, OUTPUT>> {
    if (!isObject(input)) {
      return [this._typeIssueFactory(input, options)];
    }

    const { keyShape, valueShape, _operations } = this;

    let output = input;
    let issues = null;
    let index = -1;

    for (let key in input) {
      let value = input[key];
      let keyResult = null;

      index++;

      if (keyShape !== null) {
        keyResult = keyShape['_apply'](key, options, nonce);

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

      let valueResult = valueShape['_apply'](value, options, nonce);

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

      if ((_operations !== null || issues === null) && (keyResult !== null || valueResult !== null)) {
        if (input === output) {
          output = cloneDictHead(input, index);
        }
        setObjectProperty(output, key, value);
      }
    }
    return this._applyOperations(input, output, options, issues);
  }

  protected _applyAsync(
    input: any,
    options: ApplyOptions,
    nonce: number
  ): Promise<Result<InferRecord<KeyShape, ValueShape, OUTPUT>>> {
    return new Promise(resolve => {
      if (!isObject(input)) {
        resolve([this._typeIssueFactory(input, options)]);
        return;
      }

      const { keyShape, valueShape, _operations } = this;

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
        return applyShape(valueShape, value, options, nonce, handleValueResult);
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

        if ((_operations !== null || issues === null) && (keyChanged || valueResult !== null)) {
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
            return applyShape(keyShape, key, options, nonce, handleKeyResult);
          } else {
            return valueShape['_applyAsync'](value, options, nonce).then(handleValueResult);
          }
        }
        return this._applyOperations(input, output, options, issues);
      };

      resolve(next());
    });
  }
}
