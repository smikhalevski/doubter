import { AnyShape, Shape } from './Shape';
import { ApplyResult, ConstraintOptions, Issue, Message, ParseOptions, TypeConstraintOptions } from '../shared-types';
import {
  appendCheck,
  arrayInputType,
  concatIssues,
  createIssueFactory,
  isArray,
  isAsyncShapes,
  isEqual,
  ok,
  unshiftPath,
} from '../utils';
import {
  CODE_ARRAY_MAX,
  CODE_ARRAY_MIN,
  CODE_TUPLE,
  CODE_TYPE,
  MESSAGE_ARRAY_MAX,
  MESSAGE_ARRAY_MIN,
  MESSAGE_ARRAY_TYPE,
  MESSAGE_TUPLE,
  TYPE_ARRAY,
} from '../constants';

const integerRegex = /^(?:0|[1-9]\d*)$/;

export type InferTuple<U extends readonly AnyShape[], C extends 'input' | 'output'> = { [K in keyof U]: U[K][C] };

// prettier-ignore
export type InferArray<U extends readonly AnyShape[] | null, R extends AnyShape | null, C extends 'input' | 'output'> =
  U extends readonly AnyShape[]
    ? R extends AnyShape ? [...InferTuple<U, C>, ...R[C][]] : InferTuple<U, C>
    : R extends AnyShape ? R[C][] : any[];

/**
 * The shape that describes an array.
 *
 * @template U The list of positioned element shapes or `null` if there are no positioned elements.
 * @template R The shape of rest elements or `null` if there are no rest elements.
 */
export class ArrayShape<U extends readonly AnyShape[] | null, R extends AnyShape | null> extends Shape<
  InferArray<U, R, 'input'>,
  InferArray<U, R, 'output'>
> {
  protected _typeIssueFactory;

  /**
   * Creates a new {@linkcode ArrayShape} instance.
   *
   * @param shapes The list of positioned element shapes or `null` if there are no positioned elements.
   * @param restShape The shape of rest elements or `null` if there are no rest elements.
   * @param options The type constraint options or the type issue message.
   */
  constructor(
    /**
     * The list of positioned element shapes or `null` if there are no positioned elements.
     */
    readonly shapes: U,
    /**
     * The shape of rest elements or `null` if there are no rest elements.
     */
    readonly restShape: R,
    options?: TypeConstraintOptions | Message
  ) {
    super(arrayInputType, (shapes !== null && isAsyncShapes(shapes)) || (restShape !== null && restShape.async));

    this._typeIssueFactory =
      shapes !== null && restShape === null
        ? createIssueFactory(CODE_TUPLE, MESSAGE_TUPLE, options, shapes.length)
        : createIssueFactory(CODE_TYPE, MESSAGE_ARRAY_TYPE, options, TYPE_ARRAY);
  }

  at(key: unknown): AnyShape | null {
    const { shapes } = this;

    const index =
      typeof key === 'number' ? key : typeof key !== 'string' ? -1 : integerRegex.test(key) ? parseInt(key, 10) : -1;

    if (index % 1 !== 0 || index < 0) {
      return null;
    }
    if (shapes !== null && index < shapes.length) {
      return shapes[index];
    }
    return this.restShape;
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
    const issueFactory = createIssueFactory(CODE_ARRAY_MIN, MESSAGE_ARRAY_MIN, options, length);

    return appendCheck(this, CODE_ARRAY_MIN, options, length, input => {
      if (input.length < length) {
        return issueFactory(input);
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
    const issueFactory = createIssueFactory(CODE_ARRAY_MAX, MESSAGE_ARRAY_MAX, options, length);

    return appendCheck(this, CODE_ARRAY_MAX, options, length, input => {
      if (input.length > length) {
        return issueFactory(input);
      }
    });
  }

  apply(input: unknown, options: ParseOptions): ApplyResult<InferArray<U, R, 'output'>> {
    const { shapes, restShape, _applyChecks, _unsafe } = this;

    let inputLength;
    let shapesLength = 0;

    // noinspection CommaExpressionJS
    if (
      !isArray(input) ||
      ((inputLength = input.length),
      shapes !== null && inputLength !== (shapesLength = shapes.length) && restShape === null)
    ) {
      return [this._typeIssueFactory(input)];
    }

    let issues: Issue[] | null = null;
    let output = input;

    if (shapes !== null || restShape !== null) {
      for (let i = 0; i < inputLength; ++i) {
        const value = input[i];
        const valueShape = i < shapesLength ? shapes![i] : restShape!;
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
    if (!this.async) {
      return super.applyAsync(input, options);
    }

    return new Promise(resolve => {
      const { shapes, restShape, _applyChecks, _unsafe } = this;

      let inputLength: number;
      let shapesLength = 0;

      // noinspection CommaExpressionJS
      if (
        !isArray(input) ||
        ((inputLength = input.length),
        shapes !== null && inputLength !== (shapesLength = shapes.length) && restShape === null)
      ) {
        resolve([this._typeIssueFactory(input)]);
        return;
      }

      const promises: Promise<ApplyResult>[] = [];

      if (shapes !== null || restShape !== null) {
        for (let i = 0; i < inputLength; ++i) {
          const value = input[i];
          const valueShape = i < shapesLength ? shapes![i] : restShape!;

          promises.push(valueShape.applyAsync(value, options));
        }
      }

      resolve(
        Promise.all(promises).then(results => {
          const resultsLength = results.length;

          let issues: Issue[] | null = null;
          let output = input;

          for (let i = 0; i < resultsLength; ++i) {
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
