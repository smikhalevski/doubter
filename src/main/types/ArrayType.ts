import { AnyType, InferType, Type } from './Type';
import { Awaitable, ConstraintOptions, ParserOptions } from '../shared-types';
import {
  cloneObject,
  createCatchForKey,
  createValuesExtractor,
  isArray,
  isEqual,
  isEqualArray,
  isFast,
  promiseAll,
  promiseAllSettled,
  raiseIssue,
  raiseIssuesIfDefined,
  raiseIssuesOrCaptureForKey,
  raiseIssuesOrPush,
} from '../utils';

/**
 * The array type definition.
 *
 * @template X The type definition of array elements.
 */
export class ArrayType<X extends AnyType> extends Type<InferType<X>[]> {
  protected minLength?: number;
  protected maxLength?: number;
  protected minLengthOptions?: ConstraintOptions;
  protected maxLengthOptions?: ConstraintOptions;

  /**
   * Creates the new {@link ArrayType} instance.
   *
   * @param type The type definition of array elements.
   * @param options The type constraint options.
   */
  constructor(protected type: X, options?: ConstraintOptions) {
    super(options);
  }

  /**
   * Constrains the array length.
   *
   * @param length The length of the array to satisfy the constraint.
   * @param options The options applied to both {@link min} and {@link max} constraints.
   * @returns The new type definition.
   */
  length(length: number, options?: ConstraintOptions): this {
    return this.min(length, options).max(length, options);
  }

  /**
   * Constrains the minimum array length.
   *
   * @param length The minimum length of the array to satisfy the constraint.
   * @param options The minimum constraint options.
   * @returns The new type definition.
   */
  min(length: number, options?: ConstraintOptions): this {
    const type = cloneObject(this);
    type.minLength = length;
    type.minLengthOptions = options;
    return type;
  }

  /**
   * Constrains the maximum array length.
   *
   * @param length The maximum length of the array to satisfy the constraint.
   * @param options The maximum constraint options.
   * @returns The new type definition.
   */
  max(length: number, options?: ConstraintOptions): this {
    const type = cloneObject(this);
    type.maxLength = length;
    type.maxLengthOptions = options;
    return type;
  }

  isAsync(): boolean {
    return this.type.isAsync();
  }

  parse(input: unknown, options?: ParserOptions): Awaitable<InferType<X>[]> {
    if (!isArray(input)) {
      raiseIssue(input, 'type', 'array', this.options, 'Must be an array');
    }

    const { minLength, maxLength, type } = this;
    const inputLength = input.length;

    let issues;

    if (minLength != null && inputLength < minLength) {
      issues = raiseIssuesOrPush(
        issues,
        options,
        input,
        'arrayMinLength',
        minLength,
        this.minLengthOptions,
        'Must have the minimum length of ' + minLength
      );
    }

    if (maxLength != null && inputLength > maxLength) {
      issues = raiseIssuesOrPush(
        issues,
        options,
        input,
        'arrayMaxLength',
        maxLength,
        this.maxLengthOptions,
        'Must have the maximum length of ' + maxLength
      );
    }

    if (type.isAsync()) {
      const promises = [];

      const handleOutput = (output: unknown[]) => (isEqualArray(input, output) ? input : output);

      for (let i = 0; i < inputLength; ++i) {
        promises.push(type.parse(input[i], options).catch(createCatchForKey(i)));
      }
      if (isFast(options)) {
        return promiseAll(promises).then(handleOutput);
      }
      return promiseAllSettled(promises).then(createValuesExtractor(issues)).then(handleOutput);
    }

    let output = input;

    for (let i = 0; i < inputLength; ++i) {
      const value = input[i];

      let outputValue;
      try {
        outputValue = type.parse(value, options);
      } catch (error) {
        issues = raiseIssuesOrCaptureForKey(error, issues, options, i);
      }
      if (isEqual(outputValue, value) || issues !== undefined) {
        continue;
      }
      if (output === input) {
        output = input.slice(0);
      }
      output[i] = outputValue;
    }

    raiseIssuesIfDefined(issues);

    return output;
  }
}
