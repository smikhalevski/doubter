import { AnyShape, Shape } from './Shape';
import { ConstraintOptions, ParserOptions } from './shared-types';
import {
  addConstraint,
  applyConstraints,
  createCatchForKey,
  createSettledResultExtractor,
  dieError,
  isArray,
  isEqual,
  isEqualArray,
  promiseAll,
  promiseAllSettled,
  raiseError,
  raiseOrCaptureError,
} from './utils';
import { ValidationError } from '../ValidationError';

export class ArrayShape<X extends AnyShape> extends Shape<X['input'][], X['output'][]> {
  constructor(protected shape: X, protected options?: ConstraintOptions | string) {
    super(shape.async);
  }

  length(length: number, options?: ConstraintOptions | string): this {
    return this.min(length, options).max(length, options);
  }

  min(length: number, options?: ConstraintOptions | string): this {
    return addConstraint(this, 'min', input => {
      if (input.length < length) {
        raiseError(input, 'arrayMinLength', length, options, 'Must have the minimum length of ' + length);
      }
    });
  }

  max(length: number, options?: ConstraintOptions | string): this {
    return addConstraint(this, 'max', input => {
      if (input.length > length) {
        raiseError(input, 'arrayMaxLength', length, options, 'Must have the maximum length of ' + length);
      }
    });
  }

  parse(input: unknown, options?: ParserOptions): X['output'][] {
    if (!isArray(input)) {
      raiseError(input, 'type', 'array', this.options, 'Must be an array');
    }

    const { shape, constraints } = this;

    let rootError: ValidationError | null = null;

    if (constraints !== undefined) {
      rootError = applyConstraints(input, constraints, options, rootError);
    }

    let output = input;

    for (let i = 0; i < input.length; ++i) {
      const inputValue = input[i];

      let outputValue;
      try {
        outputValue = shape.parse(input[i]);
      } catch (error) {
        rootError = raiseOrCaptureError(error, rootError, options);
      }
      if (isEqual(outputValue, inputValue) || rootError !== undefined) {
        continue;
      }
      if (output === input) {
        output = input.slice(0);
      }
      output[i] = outputValue;
    }

    dieError(rootError);
    return output;
  }

  parseAsync(input: unknown, options?: ParserOptions): Promise<X['output'][]> {
    if (!isArray(input)) {
      raiseError(input, 'type', 'array', this.options, 'Must be an array');
    }

    const { shape, constraints } = this;

    let rootError: ValidationError | null = null;

    if (constraints !== undefined) {
      rootError = applyConstraints(input, constraints, options, rootError);
    }

    const promises = [];

    for (let i = 0; i < input.length; ++i) {
      promises.push(shape.parseAsync(input[i], options).catch(createCatchForKey(i)));
    }

    const returnOutput = (output: unknown[]): unknown[] => {
      return isEqualArray(input, output) ? input : output;
    };

    if (options?.fast) {
      return promiseAll(promises).then(returnOutput);
    }
    return promiseAllSettled(promises).then(createSettledResultExtractor(rootError)).then(returnOutput);
  }
}
