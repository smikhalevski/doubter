import { AnyShape, Shape } from './Shape';
import { ConstraintOptions, ParserOptions } from './shared-types';
import {
  addConstraint,
  applyConstraints,
  createCatchForKey,
  createExtractor,
  isArray,
  isEqual,
  isEqualArray,
  isInteger,
  raiseError,
  raiseIssue,
  raiseOrCaptureIssues,
} from './utils';
import { ValidationError } from '../ValidationError';

export class ArrayShape<X extends AnyShape> extends Shape<X['input'][], X['output'][]> {
  constructor(protected shape: X, protected options?: ConstraintOptions | string) {
    super(shape.async);
  }

  at(key: unknown): AnyShape | null {
    return isInteger(key) && key >= 0 ? this.shape : null;
  }

  length(length: number, options?: ConstraintOptions | string): this {
    return this.min(length, options).max(length, options);
  }

  min(length: number, options?: ConstraintOptions | string): this {
    return addConstraint(this, 'min', input => {
      if (input.length < length) {
        raiseIssue(input, 'arrayMinLength', length, options, 'Must have the minimum length of ' + length);
      }
    });
  }

  max(length: number, options?: ConstraintOptions | string): this {
    return addConstraint(this, 'max', input => {
      if (input.length > length) {
        raiseIssue(input, 'arrayMaxLength', length, options, 'Must have the maximum length of ' + length);
      }
    });
  }

  parse(input: unknown, options?: ParserOptions): X['output'][] {
    if (!isArray(input)) {
      raiseIssue(input, 'type', 'array', this.options, 'Must be an array');
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
        outputValue = shape.parse(inputValue);
      } catch (error) {
        rootError = raiseOrCaptureIssues(error, rootError, options);
      }
      if (isEqual(outputValue, inputValue) || rootError !== null) {
        continue;
      }
      if (output === input) {
        output = input.slice(0);
      }
      output[i] = outputValue;
    }

    raiseError(rootError);
    return output;
  }

  parseAsync(input: unknown, options?: ParserOptions): Promise<X['output'][]> {
    return new Promise(resolve => {
      if (!isArray(input)) {
        raiseIssue(input, 'type', 'array', this.options, 'Must be an array');
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

      if (options != null && options.fast) {
        resolve(Promise.all(promises).then(returnOutput));
      } else {
        resolve(Promise.allSettled(promises).then(createExtractor(rootError)).then(returnOutput));
      }
    });
  }
}
