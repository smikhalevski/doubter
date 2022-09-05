import { AnyType, InferType, Type } from './Type';
import { Awaitable, ParserOptions, Several } from '../shared-types';
import { extractIssues, isAsync, parseAsync, promiseAllSettled, raiseIssue } from '../utils';

/**
 * The union type definition.
 *
 * @template U The list of united type definitions.
 */
export class UnionType<U extends Several<AnyType>> extends Type<
  { [K in keyof U]: InferType<U[K]>['input'] }[number],
  { [K in keyof U]: InferType<U[K]>['output'] }[number]
> {
  /**
   * Creates a new {@link UnionType} instance.
   *
   * @param types The list of united type definitions.
   */
  constructor(protected types: U) {
    super(isAsync(types));
  }

  at(key: unknown): AnyType | null {
    const childTypes: AnyType[] = [];

    for (const type of this.types) {
      const childType = type.at(key);

      if (childType !== null) {
        childTypes.push(childType);
      }
    }
    if (childTypes.length === 0) {
      return null;
    }
    if (childTypes.length === 1) {
      return childTypes[0];
    }
    return new UnionType(childTypes as Several<AnyType>);
  }

  parse(input: unknown, options?: ParserOptions): Awaitable<{ [K in keyof U]: InferType<U[K]>['output'] }[number]> {
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
