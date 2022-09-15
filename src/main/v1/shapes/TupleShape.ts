import { AnyShape, Shape } from './Shape';
import { InputConstraintOptions, Multiple, ParserOptions } from '../shared-types';
import {
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

type InferTuple<U extends Multiple<AnyShape>, X extends 'input' | 'output'> = { [K in keyof U]: U[K][X] };

export class TupleShape<U extends Multiple<AnyShape>> extends Shape<InferTuple<U, 'input'>, InferTuple<U, 'output'>> {
  constructor(protected shapes: U, protected options?: InputConstraintOptions | string) {
    super(isAsync(shapes));
  }

  at(propertyName: unknown): AnyShape | null {
    const { shapes } = this;

    return isInteger(propertyName) && propertyName >= 0 && propertyName < shapes.length ? shapes[propertyName] : null;
  }

  parse(input: unknown, options?: ParserOptions): InferTuple<U, 'output'> {
    if (!isArray(input)) {
      raiseIssue(input, TYPE_CODE, 'array', this.options, 'Must be an array');
    }

    const { shapes, applyConstraints } = this;
    const shapesLength = shapes.length;

    if (input.length !== shapesLength) {
      raiseIssue(input, TUPLE_LENGTH_CODE, shapesLength, this.options, 'Must have a length of ' + shapesLength);
    }

    let rootError: ValidationError | null = null;
    let output = input;

    for (let i = 0; i < shapesLength; ++i) {
      const inputValue = input[i];

      let outputValue;
      try {
        outputValue = shapes[i].parse(inputValue);
      } catch (error) {
        rootError = raiseOrCaptureIssues(error, rootError, options);
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
    return output as InferTuple<U, 'output'>;
  }

  parseAsync(input: unknown, options?: ParserOptions): Promise<InferTuple<U, 'output'>> {
    return new Promise(resolve => {
      if (!isArray(input)) {
        raiseIssue(input, TYPE_CODE, 'array', this.options, 'Must be an array');
      }

      const { shapes, applyConstraints } = this;
      const shapesLength = shapes.length;

      if (input.length !== shapesLength) {
        raiseIssue(input, TUPLE_LENGTH_CODE, shapesLength, this.options, 'Must have a length of ' + shapesLength);
      }

      let rootError: ValidationError | null = null;

      if (applyConstraints !== null) {
        rootError = applyConstraints(input, options, rootError);
      }

      const outputPromises = [];

      for (let i = 0; i < shapesLength; ++i) {
        outputPromises.push(shapes[i].parseAsync(input[i], options).catch(createCatchClauseForKey(i)));
      }

      const returnOutput = (output: unknown[], rootError: ValidationError | null = null): InferTuple<U, 'output'> => {
        output = rootError !== null ? input : returnOutputArray(input, output);

        if (applyConstraints !== null) {
          rootError = applyConstraints(output, options, rootError);
        }
        raiseOnError(rootError);
        return output as InferTuple<U, 'output'>;
      };

      if (options != null && options.fast) {
        resolve(Promise.all(outputPromises).then(returnOutput));
      } else {
        resolve(Promise.allSettled(outputPromises).then(createOutputExtractor(rootError, returnOutput)));
      }
    });
  }
}
