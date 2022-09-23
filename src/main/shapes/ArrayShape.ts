import { AnyShape, Shape } from './Shape';
import {
  InputConstraintOptionsOrMessage,
  INVALID,
  Issue,
  OutputConstraintOptionsOrMessage,
  ParserOptions,
} from '../shared-types';
import {
  addConstraint,
  createCatchForKey,
  createResolveArray,
  isArray,
  isArrayIndex,
  isEqual,
  IssuesContext,
  isValidationError,
  raiseIssue,
  returnOrRaiseIssues,
  safeParseAsync,
  throwOrCaptureIssuesForKey,
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
   * @param options The constraint options or an issue message.
   */
  constructor(readonly shape: S, protected options?: InputConstraintOptionsOrMessage) {
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
    return addConstraint(this, CODE_ARRAY_MIN, options, output => {
      if (output.length < length) {
        raiseIssue(output, CODE_ARRAY_MIN, length, options, MESSAGE_ARRAY_MIN);
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
    return addConstraint(this, CODE_ARRAY_MAX, options, output => {
      if (output.length > length) {
        raiseIssue(output, CODE_ARRAY_MAX, length, options, MESSAGE_ARRAY_MAX);
      }
    });
  }

  safeParse(input: unknown, options?: ParserOptions): S['output'][] | ValidationError {
    if (!isArray(input)) {
      return raiseIssue(input, CODE_TYPE, TYPE_ARRAY, this.options, MESSAGE_ARRAY_TYPE);
    }

    const { shape, _applyConstraints } = this;
    const inputLength = input.length;

    let issues: Issue[] | null = null;
    let output = input;

    for (let i = 0; i < inputLength; ++i) {
      const inputValue = input[i];

      let outputValue = INVALID;
      try {
        outputValue = shape.safeParse(inputValue);
      } catch (error) {
        issues = throwOrCaptureIssuesForKey(error, options, issues, i);
      }
      if (isEqual(outputValue, inputValue)) {
        continue;
      }
      if (isValidationError(outputValue)) {
        issues = throwOrCaptureIssuesForKey(outputValue, options, issues, i);
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
    return returnOrRaiseIssues(output, issues);
  }

  safeParseAsync(input: unknown, options?: ParserOptions): Promise<S['output'][] | ValidationError> {
    if (!this.async) {
      return safeParseAsync(this, input, options);
    }

    return new Promise(resolve => {
      if (!isArray(input)) {
        return raiseIssue(input, CODE_TYPE, TYPE_ARRAY, this.options, MESSAGE_ARRAY_TYPE);
      }

      const { shape, _applyConstraints } = this;
      const inputLength = input.length;
      const context: IssuesContext = { issues: null };
      const promises = [];

      for (let i = 0; i < inputLength; ++i) {
        promises.push(shape.safeParseAsync(input[i], options).catch(createCatchForKey(i, options, context)));
      }

      resolve(Promise.all(promises).then(createResolveArray(input, options, context, _applyConstraints)));
    });
  }
}
