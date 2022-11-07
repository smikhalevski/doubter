import { AnyShape, Shape } from './Shape';
import { ApplyResult, ConstraintOptions, Issue, Message, ParseOptions, TypeConstraintOptions } from '../shared-types';
import { addCheck, concatIssues, createCheckConfig, isArray, isEqual, ok, raiseIssue, unshiftPath } from '../utils';
import {
  CODE_ARRAY_MAX,
  CODE_ARRAY_MIN,
  CODE_TYPE,
  MESSAGE_ARRAY_MAX,
  MESSAGE_ARRAY_MIN,
  MESSAGE_ARRAY_TYPE,
  TYPE_ARRAY,
} from './constants';

const integerRegex = /^(?:0|[1-9]\d*)$/;

export type Channel = 'input' | 'output';

export type InferTuple<U extends AnyShape[], C extends Channel> = { [K in keyof U]: U[K][C] };

export type InferArray<U extends AnyShape[], R extends AnyShape | null, C extends Channel> = R extends AnyShape
  ? [...InferTuple<U, C>, ...R[C][]]
  : InferTuple<U, C>;

/**
 * The shape that describes an array.
 *
 * @template U The list of tuple element shapes.
 * @template R The shape of rest elements.
 */
export class ArrayShape<U extends AnyShape[] = [], R extends AnyShape | null = null> extends Shape<
  InferArray<U, R, 'input'>,
  InferArray<U, R, 'output'>
> {
  protected _typeCheckConfig;

  /**
   * Creates a new {@linkcode ArrayShape} instance.
   *
   * @param tupleShapes The list of tuple element shapes.
   * @param restShape The shape of rest elements.
   * @param options The type constraint options or the type issue message.
   */
  constructor(tupleShapes: U, restShape?: R | null, options?: TypeConstraintOptions | Message);

  /**
   * Creates a new {@linkcode ArrayShape} instance.
   *
   * @param tupleShapes The list of tuple element shapes.
   * @param restShape The shape of rest elements.
   * @param options The type constraint options or the type issue message.
   */
  constructor(tupleShapes: null, restShape: R, options?: TypeConstraintOptions | Message);

  constructor(
    /**
     * The list of tuple element shapes.
     */
    readonly tupleShapes: U | null = null,
    /**
     * The shape of rest elements.
     */
    readonly restShape: R | null = null,
    options?: TypeConstraintOptions | Message
  ) {
    super();
    this._typeCheckConfig = createCheckConfig(options, CODE_TYPE, MESSAGE_ARRAY_TYPE, TYPE_ARRAY);
  }

  at(key: unknown): AnyShape | null {
    const { tupleShapes, restShape } = this;

    const index =
      typeof key === 'number' ? key : typeof key !== 'string' ? -1 : integerRegex.test(key) ? parseInt(key, 10) : -1;

    if (index % 1 === 0 || index < 0) {
      return null;
    }
    if (tupleShapes !== null && index < tupleShapes.length) {
      return tupleShapes[index];
    }
    return restShape;
  }

  /**
   * Constrains the array length.
   *
   * @param length The minimum array length.
   * @param options The constraint options or an issue message.
   * @returns The clone of the shape.
   */
  length(length: number, options?: ConstraintOptions | Message): this {
    return this.min(length, options).max(length, options);
  }

  /**
   * Constrains the minimum array length.
   *
   * @param length The minimum array length.
   * @param options The constraint options or an issue message.
   * @returns The clone of the shape.
   */
  min(length: number, options?: ConstraintOptions | Message): this {
    const checkConfig = createCheckConfig(options, CODE_ARRAY_MIN, MESSAGE_ARRAY_MIN, length);

    return addCheck(this, CODE_ARRAY_MIN, options, input => {
      if (input.length < length) {
        return raiseIssue(checkConfig, input);
      }
    });
  }

  /**
   * Constrains the maximum array length.
   *
   * @param length The maximum array length.
   * @param options The constraint options or an issue message.
   * @returns The clone of the shape.
   */
  max(length: number, options?: ConstraintOptions | Message): this {
    const checkConfig = createCheckConfig(options, CODE_ARRAY_MAX, MESSAGE_ARRAY_MAX, length);

    return addCheck(this, CODE_ARRAY_MAX, options, input => {
      if (input.length < length) {
        return raiseIssue(checkConfig, input);
      }
    });
  }

  apply(input: unknown, options: ParseOptions): ApplyResult<InferArray<U, R, 'output'>> {
    const { tupleShapes, restShape, _applyChecks, _unsafe } = this;

    let inputLength;
    let tupleLength = 0;

    // noinspection CommaExpressionJS
    if (
      !isArray(input) ||
      ((inputLength = input.length),
      restShape === null && tupleShapes !== null && inputLength !== (tupleLength = tupleShapes.length))
    ) {
      return raiseIssue(this._typeCheckConfig, input);
    }

    let issues: Issue[] | null = null;
    let output = input;

    for (let i = 0; i < inputLength; ++i) {
      const value = input[i];
      const valueShape = i < tupleLength ? tupleShapes![i] : restShape!;
      const result = valueShape.apply(value, options);

      if (result === null) {
        continue;
      }
      if (isArray(result)) {
        unshiftPath(result, i);

        if (!options.verbose) {
          return result;
        }
        issues = concatIssues(issues, result);
        continue;
      }
      if ((_unsafe || issues === null) && !isEqual(value, result.value)) {
        if (input === output) {
          output = input.slice(0);
        }
        output[i] = result.value;
      }
    }

    if (_applyChecks !== null && (_unsafe || issues === null)) {
      issues = _applyChecks(output, issues, options);
    }
    if (issues === null && input !== output) {
      return ok(output as InferArray<U, R, 'output'>);
    }
    return issues;
  }

  applyAsync(input: unknown, options: ParseOptions): Promise<ApplyResult<InferArray<U, R, 'output'>>> {
    return new Promise(resolve => {
      const { tupleShapes, restShape, _applyChecks, _unsafe } = this;

      let inputLength: number;
      let tupleLength = 0;

      // noinspection CommaExpressionJS
      if (
        !isArray(input) ||
        ((inputLength = input.length),
        restShape === null && tupleShapes !== null && inputLength !== (tupleLength = tupleShapes.length))
      ) {
        return raiseIssue(this._typeCheckConfig, input);
      }

      const promises: Promise<ApplyResult>[] = [];

      for (let i = 0; i < inputLength; ++i) {
        const value = input[i];
        const valueShape = i < tupleLength ? tupleShapes![i] : restShape!;

        promises.push(valueShape.applyAsync(value, options));
      }

      resolve(
        Promise.all(promises).then(results => {
          let issues: Issue[] | null = null;
          let output = input;

          for (let i = 0; i < inputLength; ++i) {
            const result = results[i];

            if (result === null) {
              continue;
            }
            if (isArray(result)) {
              unshiftPath(result, i);

              if (!options.verbose) {
                return result;
              }
              issues = concatIssues(issues, result);
              continue;
            }
            if ((_unsafe || issues === null) && !isEqual(input[i], result.value)) {
              if (input === output) {
                output = input.slice(0);
              }
              output[i] = result.value;
            }
          }

          if (_applyChecks !== null && (_unsafe || issues === null)) {
            issues = _applyChecks(output, issues, options);
          }
          if (issues === null && input !== output) {
            return ok(output as InferArray<U, R, 'output'>);
          }
          return issues;
        })
      );
    });
  }
}
