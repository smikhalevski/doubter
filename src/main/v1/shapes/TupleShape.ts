import { AnyShape, Shape } from './Shape';
import { InputConstraintOptions, Multiple, ParserOptions } from '../shared-types';
import {
  applyConstraints,
  createCatchClauseForKey,
  createOutputExtractor,
  isArray,
  isAsync,
  isEqual,
  isInteger,
  raiseIssue,
  raiseOnError,
  raiseOrCaptureIssues,
  returnOutputArray,
} from '../utils';
import { ValidationError } from '../ValidationError';
import { TUPLE_LENGTH_CODE, TYPE_CODE } from './issue-codes';

type OutputTuple<U extends Multiple<AnyShape>> = { [K in keyof U]: U[K]['output'] };

export class TupleShape<U extends Multiple<AnyShape>> extends Shape<{ [K in keyof U]: U[K]['input'] }, OutputTuple<U>> {
  constructor(protected shapes: U, protected options?: InputConstraintOptions | string) {
    super(isAsync(shapes));
  }

  at(propertyName: unknown): AnyShape | null {
    const { shapes } = this;

    return isInteger(propertyName) && propertyName >= 0 && propertyName < shapes.length ? shapes[propertyName] : null;
  }

  parse(input: unknown, options?: ParserOptions): OutputTuple<U> {
    if (!isArray(input)) {
      raiseIssue(input, TYPE_CODE, 'array', this.options, 'Must be an array');
    }

    const { shapes, constraints } = this;
    const shapesLength = shapes.length;

    if (input.length !== shapesLength) {
      raiseIssue(input, TUPLE_LENGTH_CODE, shapesLength, this.options, 'Must have a length of ' + shapesLength);
    }

    let rootError: ValidationError | null = null;
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

    if (constraints !== null) {
      rootError = applyConstraints(input as OutputTuple<U>, constraints, options, rootError);
    }

    raiseOnError(rootError);
    return output as OutputTuple<U>;
  }

  parseAsync(input: unknown, options?: ParserOptions): Promise<OutputTuple<U>> {
    return new Promise(resolve => {
      if (!isArray(input)) {
        raiseIssue(input, TYPE_CODE, 'array', this.options, 'Must be an array');
      }

      const { shapes, constraints } = this;
      const shapesLength = shapes.length;

      if (input.length !== shapesLength) {
        raiseIssue(input, TUPLE_LENGTH_CODE, shapesLength, this.options, 'Must have a length of ' + shapesLength);
      }

      let rootError: ValidationError | null = null;

      if (constraints !== null) {
        rootError = applyConstraints(input as U, constraints, options, rootError);
      }

      const outputPromises = [];

      for (let i = 0; i < input.length; ++i) {
        outputPromises.push(shapes[i].parseAsync(input[i], options).catch(createCatchClauseForKey(i)));
      }

      const returnOutput = (output: unknown[], rootError: ValidationError | null = null): OutputTuple<U> => {
        output = rootError !== null ? input : returnOutputArray(input, output);

        if (constraints !== null) {
          rootError = applyConstraints(output, constraints, options, rootError);
        }
        raiseOnError(rootError);
        return output as OutputTuple<U>;
      };

      if (options != null && options.fast) {
        resolve(Promise.all(outputPromises).then(returnOutput));
      } else {
        resolve(Promise.allSettled(outputPromises).then(createOutputExtractor(rootError, returnOutput)));
      }
    });
  }
}
