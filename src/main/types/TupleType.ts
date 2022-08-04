import { AnyType, InferType, Type } from './Type';
import { Awaitable, ConstraintOptions, ParserOptions, Several } from '../shared-types';
import {
  createCatchForKey,
  createValuesExtractor,
  isArray,
  isAsync,
  isEqual,
  isEqualArray,
  isFast,
  isInteger,
  parseAsync,
  promiseAll,
  promiseAllSettled,
  raiseIssue,
  raiseIssuesIfDefined,
  raiseIssuesOrCaptureForKey,
} from '../utils';

export type InferTupleType<U extends Several<AnyType>> = { [K in keyof U]: InferType<U[K]> };

/**
 * The tuple type definition.
 *
 * @template U The list of tuple elements.
 */
export class TupleType<U extends Several<AnyType>> extends Type<InferTupleType<U>> {
  /**
   * Creates a new {@link TupleType} instance.
   *
   * @param types The list of tuple elements.
   * @param options
   */
  constructor(protected types: U, options?: ConstraintOptions) {
    super(isAsync(types), options);
  }

  at(key: unknown): AnyType | null {
    const { types } = this;

    return typeof key === 'number' && isInteger(key) && key > -1 && key < types.length ? types[key] : null;
  }

  parse(input: unknown, options?: ParserOptions): Awaitable<InferTupleType<U>> {
    if (!isArray(input)) {
      raiseIssue(input, 'type', 'array', this.options, 'Must be an array');
    }

    const { types } = this;
    const typesLength = types.length;

    if (input.length !== typesLength) {
      raiseIssue(input, 'tupleLength', typesLength, this.options, 'Must have a length of ' + typesLength);
    }

    if (this.async) {
      const promises = [];

      const handleOutput = (output: any) => (isEqualArray(input, output) ? input : output);

      for (let i = 0; i < typesLength; ++i) {
        promises.push(parseAsync(types[i], input[i], options).catch(createCatchForKey(i)));
      }
      if (isFast(options)) {
        return promiseAll(promises).then(handleOutput);
      }
      return promiseAllSettled(promises).then(createValuesExtractor()).then(handleOutput);
    }

    let output = input;
    let issues;

    for (let i = 0; i < typesLength; ++i) {
      const value = input[i];

      let outputValue;
      try {
        outputValue = types[i].parse(value, options);
      } catch (error) {
        issues = raiseIssuesOrCaptureForKey(error, issues, options, i);
      }
      if (isEqual(outputValue, value) || issues !== undefined) {
        continue;
      }
      if (output === input) {
        output = input.slice(0);
      }
      output[i] = outputValue;
    }

    raiseIssuesIfDefined(issues);

    return output as InferTupleType<U>;
  }
}
