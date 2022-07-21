import { AnyType, InferType, Type } from './Type';
import { ParserContext } from '../ParserContext';
import { createIssue, isAsync } from '../utils';
import { Several } from '../shared-types';

/**
 * The tuple type definition.
 *
 * @template U The list of tuple elements.
 */
export class TupleType<U extends Several<AnyType>> extends Type<{ [K in keyof U]: InferType<U[K]> }> {
  /**
   * Creates a new {@link TupleType} instance.
   *
   * @param _types The list of tuple elements.
   */
  constructor(private _types: U) {
    super();
  }

  isAsync(): boolean {
    return isAsync(this._types);
  }

  _parse(input: unknown, context: ParserContext): any {
    if (!Array.isArray(input)) {
      context.raiseIssue(createIssue(context, 'type', input, 'array'));
      return input;
    }

    const { _types } = this;
    const typesLength = _types.length;
    const inputLength = input.length;

    if (inputLength !== typesLength) {
      context.raiseIssue(createIssue(context, 'tupleLength', input, typesLength));

      if (context.aborted) {
        return input;
      }
    }

    if (this.isAsync()) {
      const promises = [];

      for (let i = 0; i < typesLength; ++i) {
        promises.push(_types[i]._parse(input[i], context.fork().enterKey(i)));
      }

      return Promise.all(promises);
    }

    const output = [];

    for (let i = 0; i < typesLength; ++i) {
      context.enterKey(i);
      output[i] = _types[i]._parse(input[i], context);
      context.exitKey();

      if (context.aborted) {
        return input;
      }
    }
    return output;
  }
}
