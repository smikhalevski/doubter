import { AnyShape, Shape } from './Shape';
import { ConstraintOptions, ParserOptions, Multiple } from '../shared-types';
import {
  applyConstraints,
  createCatchForKey,
  createExtractor,
  isArray,
  isAsync,
  isEqual,
  isEqualArray,
  isInteger,
  raiseError,
  raiseIssue,
  raiseOrCaptureIssues,
} from '../utils';
import { ValidationError } from '../ValidationError';

type OutputTuple<U extends Multiple<AnyShape>> = { [K in keyof U]: U[K]['output'] };

export class TupleShape<U extends Multiple<AnyShape>> extends Shape<{ [K in keyof U]: U[K]['input'] }, OutputTuple<U>> {
  constructor(protected shapes: U, protected options?: ConstraintOptions | string) {
    super(isAsync(shapes));
  }

  at(key: unknown): AnyShape | null {
    const { shapes } = this;

    return isInteger(key) && key >= 0 && key < shapes.length ? shapes[key] : null;
  }

  parse(input: unknown, options?: ParserOptions): OutputTuple<U> {
    if (!isArray(input)) {
      raiseIssue(input, 'type', 'array', this.options, 'Must be an array');
    }

    const { shapes, constraints } = this;
    const shapesLength = shapes.length;

    if (input.length !== shapesLength) {
      raiseIssue(input, 'tupleLength', shapesLength, this.options, 'Must have a length of ' + shapesLength);
    }

    let rootError: ValidationError | null = null;

    if (constraints !== undefined) {
      rootError = applyConstraints(input as OutputTuple<U>, constraints, options, rootError);
    }

    let output = input;

    for (let i = 0; i < input.length; ++i) {
      const inputValue = input[i];

      let outputValue;
      try {
        outputValue = shapes[i].parse(inputValue);
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
    return output as OutputTuple<U>;
  }

  parseAsync(input: unknown, options?: ParserOptions): Promise<OutputTuple<U>> {
    return new Promise(resolve => {
      if (!isArray(input)) {
        raiseIssue(input, 'type', 'array', this.options, 'Must be an array');
      }

      const { shapes, constraints } = this;
      const shapesLength = shapes.length;

      if (input.length !== shapesLength) {
        raiseIssue(input, 'tupleLength', shapesLength, this.options, 'Must have a length of ' + shapesLength);
      }

      let rootError: ValidationError | null = null;

      if (constraints !== undefined) {
        rootError = applyConstraints(input as U, constraints, options, rootError);
      }

      const promises = [];

      for (let i = 0; i < input.length; ++i) {
        promises.push(shapes[i].parseAsync(input[i], options).catch(createCatchForKey(i)));
      }

      const returnOutput = (output: unknown[]): OutputTuple<U> => {
        return (isEqualArray(input, output) ? input : output) as OutputTuple<U>;
      };

      if (options != null && options.fast) {
        resolve(Promise.all(promises).then(returnOutput));
      } else {
        resolve(Promise.allSettled(promises).then(createExtractor(rootError)).then(returnOutput));
      }
    });
  }
}
