import { AnyShape, Shape } from './Shape';
import { InputConstraintOptionsOrMessage, INVALID, Issue, ParserOptions, Tuple } from '../shared-types';
import {
  createCatchForKey,
  createResolveArray,
  isArray,
  isAsyncShapes,
  isEqual,
  isTupleIndex,
  parseAsync,
  ParserContext,
  raiseIfIssues,
  raiseIssue,
  raiseOrCaptureIssuesForKey,
} from '../utils';
import { CODE_TUPLE_LENGTH, CODE_TYPE, MESSAGE_ARRAY_TYPE, MESSAGE_TUPLE_LENGTH, TYPE_ARRAY } from './constants';

type InferTuple<U extends Tuple<AnyShape>, C extends 'input' | 'output'> = { [K in keyof U]: U[K][C] };

/**
 * The shape of a tuple of elements
 *
 * @template U The list of tuple elements.
 */
export class TupleShape<U extends Tuple<AnyShape>> extends Shape<InferTuple<U, 'input'>, InferTuple<U, 'output'>> {
  /**
   * Creates a new {@linkcode TupleShape} instance.
   *
   * @param shapes The list of tuple element shapes.
   * @param options The constraint options or an issue message.
   */
  constructor(readonly shapes: Readonly<U>, protected options?: InputConstraintOptionsOrMessage) {
    super(isAsyncShapes(shapes));
  }

  at(key: any): AnyShape | null {
    return isTupleIndex(key, this.shapes.length) ? this.shapes[key] : null;
  }

  parse(input: unknown, options?: ParserOptions): InferTuple<U, 'output'> {
    if (!isArray(input)) {
      raiseIssue(input, CODE_TYPE, TYPE_ARRAY, this.options, MESSAGE_ARRAY_TYPE);
    }

    const { shapes, applyConstraints } = this;
    const shapesLength = shapes.length;

    if (input.length !== shapesLength) {
      raiseIssue(input, CODE_TUPLE_LENGTH, shapesLength, this.options, MESSAGE_TUPLE_LENGTH);
    }

    let issues: Issue[] | null = null;
    let output = input;

    for (let i = 0; i < shapesLength; ++i) {
      const inputValue = input[i];

      let outputValue = INVALID;
      try {
        outputValue = shapes[i].parse(inputValue);
      } catch (error) {
        issues = raiseOrCaptureIssuesForKey(error, options, issues, i);
      }
      if (isEqual(outputValue, inputValue)) {
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
        raiseIssue(input, CODE_TYPE, TYPE_ARRAY, this.options, MESSAGE_ARRAY_TYPE);
      }

      const { shapes, applyConstraints } = this;
      const shapesLength = shapes.length;
      const context: ParserContext = { issues: null };
      const promises = [];

      if (input.length !== shapesLength) {
        raiseIssue(input, CODE_TUPLE_LENGTH, shapesLength, this.options, MESSAGE_TUPLE_LENGTH);
      }

      for (let i = 0; i < shapesLength; ++i) {
        promises.push(shapes[i].parseAsync(input[i], options).catch(createCatchForKey(i, options, context)));
      }

      resolve(Promise.all(promises).then(createResolveArray(input, options, context, applyConstraints)));
    });
  }
}
