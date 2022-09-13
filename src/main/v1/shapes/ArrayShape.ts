import { AnyShape, Shape } from './Shape';
import { ConstraintOptions, ParserOptions } from '../shared-types';
import {
  applyConstraints,
  captureIssuesForKey,
  extractSettledValues,
  isArray,
  isEqual,
  isInteger,
  raiseIssue,
  raiseOnError,
  raiseOrCaptureIssuesForKey,
  returnOutputArray,
} from '../utils';
import { ValidationError } from '../ValidationError';

/**
 * The shape that constrains every element of an array with the element shape.
 */
export class ArrayShape<S extends AnyShape> extends Shape<S['input'][], S['output'][]> {
  /**
   * Creates a new {@link ArrayShape} instance.
   *
   * @param shape The shape of an array element.
   * @param options The constraint options or an issue message.
   */
  constructor(protected shape: S, protected options?: ConstraintOptions | string) {
    super(shape.async);
  }

  at(key: unknown): AnyShape | null {
    return isInteger(key) && key >= 0 ? this.shape : null;
  }

  /**
   * Constrains the array length.
   *
   * @param length The minimum array length.
   * @param options The constraint options or an issue message.
   * @returns The copy of the shape.
   */
  length(length: number, options?: ConstraintOptions | string): this {
    return this.min(length, options).max(length, options);
  }

  /**
   * Constrains the minimum array length.
   *
   * @param length The minimum array length.
   * @param options The constraint options or an issue message.
   * @returns The copy of the shape.
   */
  min(length: number, options?: ConstraintOptions | string): this {
    return this.constrain(output => {
      if (output.length < length) {
        raiseIssue(output, 'arrayMinLength', length, options, 'Must have the minimum length of ' + length);
      }
    }, 'min');
  }

  /**
   * Constrains the maximum array length.
   *
   * @param length The maximum array length.
   * @param options The constraint options or an issue message.
   * @returns The copy of the shape.
   */
  max(length: number, options?: ConstraintOptions | string): this {
    return this.constrain(output => {
      if (output.length > length) {
        raiseIssue(output, 'arrayMaxLength', length, options, 'Must have the maximum length of ' + length);
      }
    }, 'max');
  }

  parse(input: unknown, options?: ParserOptions): S['output'][] {
    if (!isArray(input)) {
      raiseIssue(input, 'type', 'array', this.options, 'Must be an array');
    }

    const { shape, constraints } = this;

    let rootError: ValidationError | null = null;

    let output = input;

    for (let i = 0; i < input.length; ++i) {
      const inputValue = input[i];

      let outputValue;
      try {
        outputValue = shape.parse(inputValue);
      } catch (error) {
        rootError = raiseOrCaptureIssuesForKey(error, rootError, options, i);
      }
      if (isEqual(outputValue, inputValue) || rootError !== null) {
        continue;
      }
      if (output === input) {
        output = input.slice(0);
      }
      output[i] = outputValue;
    }

    if (constraints !== null) {
      rootError = applyConstraints(input, constraints, options, rootError);
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
        raiseIssue(input, 'type', 'array', this.options, 'Must be an array');
      }

      const { shape, constraints } = this;

      let rootError: ValidationError | null = null;

      const outputPromises = [];

      for (let i = 0; i < input.length; ++i) {
        outputPromises.push(shape.parseAsync(input[i], options).catch(captureIssuesForKey(i)));
      }

      const returnOutput = (output: unknown[]): unknown[] => {
        output = returnOutputArray(input, output);

        if (constraints !== null) {
          rootError = applyConstraints(output, constraints, options, rootError);
        }
        raiseOnError(rootError);
        return output;
      };

      if (options != null && options.fast) {
        resolve(Promise.all(outputPromises).then(returnOutput));
      } else {
        resolve(Promise.allSettled(outputPromises).then(extractSettledValues(rootError)).then(returnOutput));
      }
    });
  }
}
