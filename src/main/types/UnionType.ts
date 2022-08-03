import { AnyType, InferType, Type } from './Type';
import { Awaitable, ParserOptions, Several } from '../shared-types';
import { extractIssues, isAsync, parseAsync, promiseAllSettled, raiseIssue } from '../utils';

export type InferUnionType<U extends Several<AnyType>> = { [K in keyof U]: InferType<U[K]> }[number];

/**
 * The union type definition.
 *
 * @template U The list of united type definitions.
 */
export class UnionType<U extends Several<AnyType>> extends Type<InferUnionType<U>> {
  /**
   * Creates a new {@link UnionType} instance.
   *
   * @param types The list of united type definitions.
   */
  constructor(protected types: U) {
    super(isAsync(types));
  }

  parse(input: unknown, options?: ParserOptions): Awaitable<InferUnionType<U>> {
    const { types } = this;

    if (this.async) {
      const promises = [];

      for (const type of types) {
        promises.push(parseAsync(type, input, options));
      }

      return promiseAllSettled(promises).then(results => {
        let issues;

        for (const result of results) {
          if (result.status === 'fulfilled') {
            return result.value;
          }
          issues = extractIssues(result.reason);
        }

        raiseIssue(input, 'union', issues, this.options, 'Must conform a union');
      });
    }

    let issues;

    for (const type of types) {
      try {
        return type.parse(input);
      } catch (error) {
        issues = extractIssues(error);
      }
    }

    raiseIssue(input, 'union', issues, this.options, 'Must conform a union');
  }
}
