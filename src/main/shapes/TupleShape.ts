import { AnyShape, Shape } from './Shape';
import { InputConstraintOptionsOrMessage, INVALID, Issue, ParserOptions, Tuple } from '../shared-types';
import {
  applySafeParseAsync,
  captureIssuesForKey,
  createResolveArray,
  isAsyncShapes,
  isEarlyReturn,
  isTupleIndex,
  raiseIssue,
  returnValueOrRaiseIssues,
} from '../utils';
import { CODE_TUPLE, CODE_TYPE, MESSAGE_ARRAY_TYPE, MESSAGE_TUPLE, TYPE_ARRAY } from './constants';
import { isValidationError, ValidationError } from '../ValidationError';
import { isArray, isEqual } from '../lang-utils';

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
   * @param _options The constraint options or an issue message.
   */
  constructor(readonly shapes: Readonly<U>, protected _options?: InputConstraintOptionsOrMessage) {
    super(isAsyncShapes(shapes));
  }

  at(key: any): AnyShape | null {
    return isTupleIndex(key, this.shapes.length) ? this.shapes[key] : null;
  }

  safeParse(input: unknown, options?: ParserOptions): InferTuple<U, 'output'> | ValidationError {
    if (!isArray(input)) {
      return raiseIssue(input, CODE_TYPE, TYPE_ARRAY, this._options, MESSAGE_ARRAY_TYPE);
    }

    const { shapes, _applyConstraints } = this;
    const shapesLength = shapes.length;

    if (input.length !== shapesLength) {
      return raiseIssue(input, CODE_TUPLE, shapesLength, this._options, MESSAGE_TUPLE);
    }

    let issues: Issue[] | null = null;
    let output = input;

    for (let i = 0; i < shapesLength; ++i) {
      const inputValue = input[i];

      let outputValue = shapes[i].safeParse(inputValue);

      if (isEqual(outputValue, inputValue)) {
        continue;
      }

      if (isValidationError(outputValue)) {
        issues = captureIssuesForKey(outputValue, options, issues, i);

        if (isEarlyReturn(options)) {
          return outputValue;
        }
        outputValue = INVALID;
      }

      if (output === input) {
        output = input.slice(0);
      }
      output[i] = outputValue;
    }

    if (_applyConstraints !== null) {
      issues = _applyConstraints(output, options, issues);
    }

    return returnValueOrRaiseIssues(output as InferTuple<U, 'output'>, issues);
  }

  safeParseAsync(input: unknown, options?: ParserOptions): Promise<InferTuple<U, 'output'> | ValidationError> {
    if (!this.async) {
      return applySafeParseAsync(this, input, options);
    }

    return new Promise(resolve => {
      if (!isArray(input)) {
        resolve(raiseIssue(input, CODE_TYPE, TYPE_ARRAY, this._options, MESSAGE_ARRAY_TYPE));
        return;
      }

      const { shapes, _applyConstraints } = this;
      const shapesLength = shapes.length;
      const promises = [];

      if (input.length !== shapesLength) {
        return raiseIssue(input, CODE_TUPLE, shapesLength, this._options, MESSAGE_TUPLE);
      }

      for (let i = 0; i < shapesLength; ++i) {
        promises.push(shapes[i].safeParseAsync(input[i], options));
      }

      resolve(Promise.all(promises).then(createResolveArray(input, options, _applyConstraints)));
    });
  }
}
