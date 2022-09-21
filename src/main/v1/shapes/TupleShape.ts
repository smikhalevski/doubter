import { AnyShape, Shape } from './Shape';
import { InputConstraintOptions, Issue, Multiple, ParserOptions } from '../shared-types';
import {
  createCatchForKey,
  createResolveArray,
  isArray,
  isAsyncShapes,
  isEqual,
  isInteger,
  parseAsync,
  ParserContext,
  raiseIfIssues,
  raiseIssue,
  raiseOrCaptureIssuesForKey,
} from '../utils';
import { INVALID, TUPLE_LENGTH_CODE, TYPE_CODE } from './issue-codes';

type InferTuple<U extends Multiple<AnyShape>, X extends 'input' | 'output'> = { [K in keyof U]: U[K][X] };

export class TupleShape<U extends Multiple<AnyShape>> extends Shape<InferTuple<U, 'input'>, InferTuple<U, 'output'>> {
  constructor(protected shapes: U, protected options?: InputConstraintOptions | string) {
    super(isAsyncShapes(shapes));
  }

  at(key: unknown): AnyShape | null {
    const { shapes } = this;

    return isInteger(key) && key >= 0 && key < shapes.length ? shapes[key] : null;
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

    let issues: Issue[] | null = null;
    let output = input;

    for (let i = 0; i < shapesLength; ++i) {
      const inputValue = input[i];

      let valid = true;
      let outputValue = INVALID;
      try {
        outputValue = shapes[i].parse(inputValue);
      } catch (error) {
        valid = false;
        issues = raiseOrCaptureIssuesForKey(error, options, issues, i);
      }
      if (valid && isEqual(outputValue, inputValue)) {
        continue;
      }
      if (output === input) {
        output = input.slice(0);
      }
      output[i] = outputValue;
    }

    if (applyConstraints !== null) {
      issues = applyConstraints(output as InferTuple<U, 'output'>, options, issues);
    }
    raiseIfIssues(issues);

    return output as InferTuple<U, 'output'>;
  }

  parseAsync(input: unknown, options?: ParserOptions): Promise<InferTuple<U, 'output'>> {
    if (!this.async) {
      return parseAsync(this, input, options);
    }

    return new Promise(resolve => {
      if (!isArray(input)) {
        raiseIssue(input, TYPE_CODE, 'array', this.options, 'Must be an array');
      }

      const { shapes, applyConstraints } = this;
      const shapesLength = shapes.length;
      const context: ParserContext = { issues: null };
      const promises = [];

      if (input.length !== shapesLength) {
        raiseIssue(input, TUPLE_LENGTH_CODE, shapesLength, this.options, 'Must have a length of ' + shapesLength);
      }

      for (let i = 0; i < shapesLength; ++i) {
        promises.push(shapes[i].parseAsync(input[i], options).catch(createCatchForKey(i, options, context)));
      }

      resolve(Promise.all(promises).then(createResolveArray(input, options, context, applyConstraints)));
    });
  }
}
