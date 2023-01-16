import { AnyShape, ValueType } from './Shape';
import { ApplyResult, ConstraintOptions, Issue, Message, ParseOptions, TypeConstraintOptions } from '../shared-types';
import {
  appendCheck,
  concatIssues,
  createIssueFactory,
  isArray,
  isAsyncShapes,
  isEqual,
  ok,
  toArrayIndex,
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
  TYPE_ANY,
  TYPE_ARRAY,
  TYPE_OBJECT,
} from '../constants';
import { CoercibleShape } from './CoercibleShape';

export type InferTuple<U extends readonly AnyShape[], C extends 'input' | 'output'> = ToArray<{
  [K in keyof U]: U[K] extends AnyShape ? U[K][C] : never;
}>;

// prettier-ignore
export type InferArray<U extends readonly AnyShape[] | null, R extends AnyShape | null, C extends 'input' | 'output'> =
  U extends readonly AnyShape[]
    ? R extends AnyShape ? [...InferTuple<U, C>, ...R[C][]] : InferTuple<U, C>
    : R extends AnyShape ? R[C][] : any[];

export type ToArray<T> = T extends any[] ? T : never;

/**
 * The shape of an array or a tuple.
 *
 * @template U The list of positioned element shapes, or `null` if there are no positioned elements.
 * @template R The shape of rest elements, or `null` if there are no rest elements.
 */
export class ArrayShape<U extends readonly AnyShape[] | null, R extends AnyShape | null> extends CoercibleShape<
  InferArray<U, R, 'input'>,
  InferArray<U, R, 'output'>
> {
  protected _options;
  protected _issueFactory;

  /**
   * Creates a new {@linkcode ArrayShape} instance.
   *
   * @param shapes The list of positioned element shapes or `null` if there are no positioned elements.
   * @param restShape The shape of rest elements or `null` if there are no rest elements.
   * @param options The type constraint options or the type issue message.
   * @template U The list of positioned element shapes, or `null` if there are no positioned elements.
   * @template R The shape of rest elements, or `null` if there are no rest elements.
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
    super();

    this._options = options;

    if (shapes !== null && restShape === null) {
      this._issueFactory = createIssueFactory(CODE_TUPLE, MESSAGE_TUPLE, options, shapes.length);
    } else {
      this._issueFactory = createIssueFactory(CODE_TYPE, MESSAGE_ARRAY_TYPE, options, TYPE_ARRAY);
    }
  }

  at(key: unknown): AnyShape | null {
    const { shapes } = this;

    const index = toArrayIndex(key);

    if (index === -1) {
      return null;
    }
    if (shapes !== null && index < shapes.length) {
      return shapes[index];
    }
    return this.restShape;
  }

  /**
   * Returns an array shape that has rest elements constrained by the given shape.
   *
   * The returned object shape would have no checks.
   *
   * @param restShape The shape of rest elements or `null` if there are no rest elements.
   * @returns The new array shape.
   * @template T The shape of rest elements.
   */
  rest<T extends AnyShape | null>(restShape: T): ArrayShape<U, T> {
    return new ArrayShape(this.shapes, restShape, this._options);
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

    return appendCheck(this, CODE_ARRAY_MIN, options, length, (input, options) => {
      if (input.length < length) {
        return issueFactory(input, options);
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

    return appendCheck(this, CODE_ARRAY_MAX, options, length, (input, options) => {
      if (input.length > length) {
        return issueFactory(input, options);
      }
    });
  }

  protected _requiresAsync(): boolean {
    return (this.shapes !== null && isAsyncShapes(this.shapes)) || (this.restShape !== null && this.restShape.async);
  }

  protected _getInputTypes(): ValueType[] {
    const { shapes, restShape } = this;

    const shape = shapes === null ? restShape : shapes.length === 1 ? shapes[0] : null;

    if (!this._coerced) {
      return [TYPE_ARRAY];
    }
    if (shapes === null && restShape === null) {
      // Elements aren't parsed, any value can be wrapped in an array
      return [TYPE_ANY];
    }
    if (shape === null) {
      // Iterables and array-like objects
      return [TYPE_OBJECT, TYPE_ARRAY];
    }
    return shape['_getInputTypes']().concat(TYPE_OBJECT, TYPE_ARRAY);
  }

  protected _apply(input: any, options: ParseOptions): ApplyResult<InferArray<U, R, 'output'>> {
    const { shapes, restShape, _applyChecks, _unsafe } = this;

    let output = options.coerced || this._coerced ? this._coerce(input) : input;
    let outputLength;
    let shapesLength = 0;
    let issues: Issue[] | null = null;

    // noinspection CommaExpressionJS
    if (
      !isArray(output) ||
      ((outputLength = output.length),
      shapes !== null &&
        (outputLength < (shapesLength = shapes.length) || (restShape === null && outputLength !== shapesLength)))
    ) {
      return this._issueFactory(input, options);
    }

    if (shapes !== null || restShape !== null) {
      for (let i = 0; i < outputLength; ++i) {
        const value = output[i];
        const valueShape = i < shapesLength ? shapes![i] : restShape!;
        const result = valueShape['_apply'](value, options);

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
      return ok(output);
    }
    return issues;
  }

  protected _applyAsync(input: any, options: ParseOptions): Promise<ApplyResult<InferArray<U, R, 'output'>>> {
    return new Promise(resolve => {
      const { shapes, restShape, _applyChecks, _unsafe } = this;

      let output = options.coerced || this._coerced ? this._coerce(input) : input;
      let outputLength;
      let shapesLength = 0;

      // noinspection CommaExpressionJS
      if (
        !isArray(output) ||
        ((outputLength = output.length),
        shapes !== null &&
          (outputLength < (shapesLength = shapes.length) || (restShape === null && outputLength !== shapesLength)))
      ) {
        resolve(this._issueFactory(input, options));
        return;
      }

      const promises: Promise<ApplyResult>[] = [];

      if (shapes !== null || restShape !== null) {
        for (let i = 0; i < outputLength; ++i) {
          const value = output[i];
          const valueShape = i < shapesLength ? shapes![i] : restShape!;

          promises.push(valueShape['_applyAsync'](value, options));
        }
      }

      resolve(
        Promise.all(promises).then(results => {
          const resultsLength = results.length;

          let issues: Issue[] | null = null;

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
            return ok(output);
          }
          return issues;
        })
      );
    });
  }

  /**
   * Coerces an input value to an array, or returns an input as is.
   *
   * @param input An input value to coerce.
   */
  protected _coerce(input: any): unknown {
    if (isArray(input)) {
      return input;
    }
    if (
      input !== null &&
      typeof input === 'object' &&
      (typeof input[Symbol.iterator] === 'function' || typeof input.length === 'number')
    ) {
      return Array.from(input);
    }
    return [input];
  }
}
