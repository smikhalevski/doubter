import { AnyShape, Shape } from './Shape';
import { ApplyResult, ConstraintOptions, Issue, Message, ParseOptions, TypeConstraintOptions } from '../shared-types';
import { addCheck, concatIssues, createCheckConfig, isArrayIndex, ok, raiseIssue, unshiftPath } from '../shape-utils';
import {
  CODE_ARRAY_MAX,
  CODE_ARRAY_MIN,
  CODE_TYPE,
  MESSAGE_ARRAY_MAX,
  MESSAGE_ARRAY_MIN,
  MESSAGE_ARRAY_TYPE,
  TYPE_ARRAY,
} from './constants';
import { isArray, isEqual } from '../lang-utils';

/**
 * The shape that constrains every element of an array with the element shape.
 *
 * @template S The element shape.
 */
export class ArrayShape<S extends AnyShape> extends Shape<S['input'][], S['output'][]> {
  protected _typeCheckConfig;

  /**
   * Creates a new {@linkcode ArrayShape} instance.
   *
   * @param shape The shape of an array element.
   * @param options The type constraint options or the type issue message.
   */
  constructor(readonly shape: S, options?: TypeConstraintOptions | Message) {
    super();
    this._typeCheckConfig = createCheckConfig(options, CODE_TYPE, MESSAGE_ARRAY_TYPE, TYPE_ARRAY);
  }

  at(key: unknown): AnyShape | null {
    return isArrayIndex(key) ? this.shape : null;
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

  apply(input: unknown, options: ParseOptions): ApplyResult<S['output'][]> {
    if (!isArray(input)) {
      return raiseIssue(this._typeCheckConfig, input);
    }

    const { shape, applyChecks, unsafe } = this;

    const arrayLength = input.length;

    let issues: Issue[] | null = null;
    let output = input;

    for (let i = 0; i < arrayLength; ++i) {
      const value = input[i];
      const result = shape.apply(value, options);

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
      if ((unsafe || issues === null) && !isEqual(value, result.value)) {
        if (input === output) {
          output = input.slice(0);
        }
        output[i] = result.value;
      }
    }

    if (applyChecks !== null && (unsafe || issues === null)) {
      issues = applyChecks(output, issues, options);
    }
    if (issues === null && input !== output) {
      return ok(output);
    }
    return issues;
  }

  applyAsync(input: unknown, options: ParseOptions): Promise<ApplyResult<S['output'][]>> {
    return new Promise(resolve => {
      if (!isArray(input)) {
        return raiseIssue(this._typeCheckConfig, input);
      }

      const { shape, applyChecks, unsafe } = this;

      const arrayLength = input.length;
      const promises: Promise<ApplyResult<S['output']>>[] = [];

      for (let i = 0; i < arrayLength; ++i) {
        const value = input[i];
        promises.push(shape.applyAsync(value, options));
      }

      resolve(
        Promise.all(promises).then(results => {
          let issues: Issue[] | null = null;
          let output = input;

          for (let i = 0; i < arrayLength; ++i) {
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
            if ((unsafe || issues === null) && !isEqual(input[i], result.value)) {
              if (input === output) {
                output = input.slice(0);
              }
              output[i] = result.value;
            }
          }

          if (applyChecks !== null && (unsafe || issues === null)) {
            issues = applyChecks(output, issues, options);
          }
          if (issues === null && input !== output) {
            return ok(output);
          }
          return issues;
        })
      );
    });
  }
}
