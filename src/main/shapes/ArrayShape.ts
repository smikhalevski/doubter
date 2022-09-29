import { AnyShape, Shape } from './Shape';
import {
  InputConstraintOptionsOrMessage,
  INVALID,
  Issue,
  OutputConstraintOptionsOrMessage,
  ParserOptions,
} from '../shared-types';
import {
  appendConstraint,
  applySafeParseAsync,
  captureIssuesForKey,
  createIssue,
  createResolveArray,
  isArray,
  isArrayIndex,
  isEarlyReturn,
  isEqual,
  isValidationError,
  raiseIssue,
  returnValueOrRaiseIssues,
} from '../utils';
import {
  CODE_ARRAY_MAX,
  CODE_ARRAY_MIN,
  CODE_TYPE,
  MESSAGE_ARRAY_MAX,
  MESSAGE_ARRAY_MIN,
  MESSAGE_ARRAY_TYPE,
  TYPE_ARRAY,
} from './constants';
import { ValidationError } from '../ValidationError';

/**
 * The shape that constrains every element of an array with the element shape.
 *
 * @template S The element shape.
 */
export class ArrayShape<S extends AnyShape> extends Shape<S['input'][], S['output'][]> {
  /**
   * Creates a new {@linkcode ArrayShape} instance.
   *
   * @param shape The shape of an array element.
   * @param _options The constraint options or an issue message.
   */
  constructor(readonly shape: S, protected _options?: InputConstraintOptionsOrMessage) {
    super(shape.async);
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
  length(length: number, options?: OutputConstraintOptionsOrMessage): this {
    return this.min(length, options).max(length, options);
  }

  /**
   * Constrains the minimum array length.
   *
   * @param length The minimum array length.
   * @param options The constraint options or an issue message.
   * @returns The clone of the shape.
   */
  min(length: number, options?: OutputConstraintOptionsOrMessage): this {
    return appendConstraint(this, CODE_ARRAY_MIN, options, output => {
      if (output.length < length) {
        return createIssue(output, CODE_ARRAY_MIN, length, options, MESSAGE_ARRAY_MIN);
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
  max(length: number, options?: OutputConstraintOptionsOrMessage): this {
    return appendConstraint(this, CODE_ARRAY_MAX, options, output => {
      if (output.length > length) {
        return createIssue(output, CODE_ARRAY_MAX, length, options, MESSAGE_ARRAY_MAX);
      }
    });
  }

  safeParse(input: unknown, options?: ParserOptions): S['output'][] | ValidationError {
    if (!isArray(input)) {
      return raiseIssue(input, CODE_TYPE, TYPE_ARRAY, this._options, MESSAGE_ARRAY_TYPE);
    }

    const { shape, _applyConstraints } = this;
    const inputLength = input.length;

    let issues: Issue[] | null = null;
    let output = input;

    for (let i = 0; i < inputLength; ++i) {
      const inputValue = input[i];

      let outputValue = shape.safeParse(inputValue);

      if (isEqual(outputValue, inputValue)) {
        continue;
      }

      if (isValidationError(outputValue)) {
        issues = captureIssuesForKey(outputValue, options, issues, i);

        if (isEarlyReturn(options)) {
          return outputValue;
        }
        outputValue = INVALID;
      }

      if (output === input) {
        output = input.slice(0);
      }
      output[i] = outputValue;
    }

    if (_applyConstraints !== null) {
      issues = _applyConstraints(output, options, issues);
    }

    return returnValueOrRaiseIssues(output, issues);
  }

  safeParseAsync(input: unknown, options?: ParserOptions): Promise<S['output'][] | ValidationError> {
    if (!this.async) {
      return applySafeParseAsync(this, input, options);
    }

    return new Promise(resolve => {
      if (!isArray(input)) {
        return raiseIssue(input, CODE_TYPE, TYPE_ARRAY, this._options, MESSAGE_ARRAY_TYPE);
      }

      const { shape, _applyConstraints } = this;
      const inputLength = input.length;
      const promises = [];

      for (let i = 0; i < inputLength; ++i) {
        promises.push(shape.safeParseAsync(input[i], options));
      }

      resolve(Promise.all(promises).then(createResolveArray(input, options, _applyConstraints)));
    });
  }
}
