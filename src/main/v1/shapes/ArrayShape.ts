import { AnyShape, Shape } from './Shape';
import { InputConstraintOptions, Issue, OutputConstraintOptions, ParserOptions } from '../shared-types';
import {
  addConstraint,
  createCatchForKey,
  createOutputExtractor,
  isArray,
  isEqual,
  isInteger,
  isObjectLike,
  raiseIssue,
  raiseOnIssues,
  raiseOrCaptureIssuesForKey,
  returnArrayOutput,
} from '../utils';
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

  at(key: unknown): AnyShape | null {
    return isInteger(key) && key >= 0 ? this.shape : null;
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

    let issues: Issue[] | null = null;
    let output = input;

    for (let i = 0; i < inputLength; ++i) {
      const inputValue = input[i];

      let outputValue;
      try {
        outputValue = shape.parse(inputValue);
      } catch (error) {
        issues = raiseOrCaptureIssuesForKey(error, options, issues, i);
        output = input;
      }
      if (isEqual(outputValue, inputValue) || issues !== null) {
        continue;
      }
      if (output === input) {
        output = input.slice(0);
      }
      output[i] = outputValue;
    }

    if (applyConstraints !== null) {
      issues = applyConstraints(output, options, issues);
    }
    raiseOnIssues(issues);

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

      const promises = [];

      for (let i = 0; i < inputLength; ++i) {
        promises.push(shape.parseAsync(input[i], options).catch(createCatchForKey(i)));
      }

      const returnOutput = (output: unknown[], issues: Issue[] | null = null): unknown[] => {
        output = issues !== null ? input : returnArrayOutput(input, output);

        if (applyConstraints !== null) {
          issues = applyConstraints(output, options, issues);
        }
        raiseOnIssues(issues);
        return output;
      };

      if (isObjectLike(options) && options.fast) {
        resolve(Promise.all(promises).then(returnOutput));
      } else {
        resolve(Promise.allSettled(promises).then(createOutputExtractor(null, returnOutput)));
      }
    });
  }
}
