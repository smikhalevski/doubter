import { AnyShape, Shape } from './Shape';
import { InputConstraintOptions, OutputConstraintOptions, ParserOptions } from '../shared-types';
import {
  addConstraint,
  createCatchClauseForKey,
  createOutputExtractor,
  isArray,
  isEqual,
  isInteger,
  raiseIssue,
  raiseOnError,
  raiseOrCaptureIssuesForKey,
  returnOutputArray,
} from '../utils';
import { ValidationError } from '../ValidationError';
import { ARRAY_MAX_CODE, ARRAY_MIN_CODE, TYPE_CODE } from './issue-codes';

/**
 * The shape that constrains every element of an array with the element shape.
 */
export class ArrayShape<S extends AnyShape> extends Shape<S['input'][], S['output'][]> {
  /**
   * Creates a new {@linkcode ArrayShape} instance.
   *
   * @param shape The shape of an array element.
   * @param options The constraint options or an issue message.
   */
  constructor(protected shape: S, protected options?: InputConstraintOptions | string) {
    super(shape.async);
  }

  at(propertyName: unknown): AnyShape | null {
    return isInteger(propertyName) && propertyName >= 0 ? this.shape : null;
  }

  /**
   * Constrains the array length.
   *
   * @param length The minimum array length.
   * @param options The constraint options or an issue message.
   * @returns The clone of the shape.
   */
  length(length: number, options?: OutputConstraintOptions | string): this {
    return this.min(length, options).max(length, options);
  }

  /**
   * Constrains the minimum array length.
   *
   * @param length The minimum array length.
   * @param options The constraint options or an issue message.
   * @returns The clone of the shape.
   */
  min(length: number, options?: OutputConstraintOptions | string): this {
    return addConstraint(this, ARRAY_MIN_CODE, options, output => {
      if (output.length < length) {
        raiseIssue(output, ARRAY_MIN_CODE, length, options, 'Must have the minimum length of ' + length);
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
  max(length: number, options?: OutputConstraintOptions | string): this {
    return addConstraint(this, ARRAY_MAX_CODE, options, output => {
      if (output.length > length) {
        raiseIssue(output, ARRAY_MAX_CODE, length, options, 'Must have the maximum length of ' + length);
      }
    });
  }

  parse(input: unknown, options?: ParserOptions): S['output'][] {
    if (!isArray(input)) {
      raiseIssue(input, TYPE_CODE, 'array', this.options, 'Must be an array');
    }

    const { shape, applyConstraints } = this;
    const inputLength = input.length;

    let rootError: ValidationError | null = null;
    let output = input;

    for (let i = 0; i < inputLength; ++i) {
      const inputValue = input[i];

      let outputValue;
      try {
        outputValue = shape.parse(inputValue);
      } catch (error) {
        rootError = raiseOrCaptureIssuesForKey(error, rootError, options, i);
        output = input;
      }
      if (isEqual(outputValue, inputValue) || rootError !== null) {
        continue;
      }
      if (output === input) {
        output = input.slice(0);
      }
      output[i] = outputValue;
    }

    if (applyConstraints !== null) {
      rootError = applyConstraints(output, options, rootError);
    }
    raiseOnError(rootError);
    return output;
  }

  parseAsync(input: unknown, options?: ParserOptions): Promise<S['output'][]> {
    if (!this.async) {
      return super.parseAsync(input, options);
    }

    return new Promise(resolve => {
      if (!isArray(input)) {
        raiseIssue(input, TYPE_CODE, 'array', this.options, 'Must be an array');
      }

      const { shape, applyConstraints } = this;
      const inputLength = input.length;

      const outputPromises = [];

      for (let i = 0; i < inputLength; ++i) {
        outputPromises.push(shape.parseAsync(input[i], options).catch(createCatchClauseForKey(i)));
      }

      const returnOutput = (output: unknown[], rootError: ValidationError | null = null): unknown[] => {
        output = rootError !== null ? input : returnOutputArray(input, output);

        if (applyConstraints !== null) {
          rootError = applyConstraints(output, options, rootError);
        }
        raiseOnError(rootError);
        return output;
      };

      if (options != null && options.fast) {
        resolve(Promise.all(outputPromises).then(returnOutput));
      } else {
        resolve(Promise.allSettled(outputPromises).then(createOutputExtractor(null, returnOutput)));
      }
    });
  }
}
