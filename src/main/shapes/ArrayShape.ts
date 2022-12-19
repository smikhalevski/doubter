import { AnyShape, Shape, ValueType } from './Shape';
import { ApplyResult, ConstraintOptions, Issue, Message, ParseOptions, TypeConstraintOptions } from '../shared-types';
import {
  appendCheck,
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
 * @template U The list of positioned element shapes or `null` if there are no positioned elements.
 * @template R The shape of rest elements or `null` if there are no rest elements.
 */
export class ArrayShape<U extends readonly AnyShape[] | null, R extends AnyShape | null> extends Shape<
  InferArray<U, R, 'input'>,
  InferArray<U, R, 'output'>
> {
  protected _options;
  protected _coercible;
  protected _issueFactory;
  protected _shapesLength;

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
    super();

    const shapesLength = shapes !== null ? shapes.length : -1;

    this._options = options;
    this._coercible = shapesLength === -1 || shapesLength === 1 || (shapesLength <= 1 && restShape !== null);
    this._shapesLength = shapesLength;

    if (shapes !== null && restShape === null) {
      this._issueFactory = createIssueFactory(CODE_TUPLE, MESSAGE_TUPLE, options, shapes.length);
    } else {
      this._issueFactory = createIssueFactory(CODE_TYPE, MESSAGE_ARRAY_TYPE, options, TYPE_ARRAY);
    }
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
   * Returns an array shape that has rest elements constrained by the given shape.
   *
   * The returned object shape would have no checks.
   *
   * @param restShape The shape of rest elements or `null` if there are no rest elements.
   * @returns The new array shape.
   * @template T The shape of rest elements.
   */
  rest<T extends AnyShape | null>(restShape: T): ArrayShape<U, T> {
    return new ArrayShape<U, T>(this.shapes, restShape, this._options);
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

  protected _checkAsync(): boolean {
    return (this.shapes !== null && isAsyncShapes(this.shapes)) || (this.restShape !== null && this.restShape.async);
  }

  protected _getInputTypes(): ValueType[] {
    return [this.coerced ? 'any' : 'array'];
  }

  protected _apply(input: any, options: ParseOptions): ApplyResult<InferArray<U, R, 'output'>> {
    const { shapes, restShape, _shapesLength, _applyChecks, _unsafe } = this;

    let inputLength;
    let output = input;
    let issues: Issue[] | null = null;

    const checked = isArray(input);

    if (
      !checked ||
      (inputLength = input.length) < _shapesLength ||
      (restShape === null && _shapesLength !== -1 && inputLength !== _shapesLength)
    ) {
      if (checked || !(options.coerced || this.coerced) || !this._coercible) {
        return this._issueFactory(input, options);
      }
      output = [input];
      inputLength = 1;
    }

    if (shapes !== null || restShape !== null) {
      for (let i = 0; i < inputLength; ++i) {
        const value = output[i];
        const valueShape = i < _shapesLength ? shapes![i] : restShape!;
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
      return ok(output as InferArray<U, R, 'output'>);
    }
    return issues;
  }

  protected _applyAsync(input: any, options: ParseOptions): Promise<ApplyResult<InferArray<U, R, 'output'>>> {
    return new Promise(resolve => {
      const { shapes, restShape, _shapesLength, _applyChecks, _unsafe } = this;

      let inputLength;
      let output = input;

      const checked = isArray(input);

      if (
        !checked ||
        (inputLength = input.length) < _shapesLength ||
        (restShape === null && _shapesLength !== -1 && inputLength !== _shapesLength)
      ) {
        if (checked || !(options.coerced || this.coerced) || !this._coercible) {
          resolve(this._issueFactory(input, options));
          return;
        }
        output = [input];
        inputLength = 1;
      }

      const promises: Promise<ApplyResult>[] = [];

      if (shapes !== null || restShape !== null) {
        for (let i = 0; i < inputLength; ++i) {
          const value = output[i];
          const valueShape = i < _shapesLength ? shapes![i] : restShape!;

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
            return ok(output as InferArray<U, R, 'output'>);
          }
          return issues;
        })
      );
    });
  }
}
