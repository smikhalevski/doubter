import { AnyType, InferType, Type } from './Type';
import { callOrChain, createIssue, isAsync } from '../utils';
import { ParserContext } from '../ParserContext';
import { Issue, Several } from '../shared-types';

/**
 * The union type definition.
 *
 * @template U The list of united type definitions.
 */
export class UnionType<U extends Several<AnyType>> extends Type<{ [K in keyof U]: InferType<U[K]> }[number]> {
  /**
   * Creates a new {@link UnionType} instance.
   *
   * @param _types The list of united type definitions.
   */
  constructor(private _types: U) {
    super();
  }

  isAsync(): boolean {
    return isAsync(this._types);
  }

  _parse(input: unknown, context: ParserContext): any {
    const { _types } = this;

    const issues: Issue[] = [];

    if (this.isAsync()) {
      let i = 0;
      let localContext: ParserContext;

      const handleInput = (): unknown => {
        if (i < _types.length) {
          localContext = context.fork(true);
          return callOrChain(_types[i]._parse(input, localContext), handleOutput);
        }

        context.raiseIssue(createIssue(context, 'union', input, issues));
        return input;
      };

      const handleOutput = (output: unknown) => {
        if (localContext.valid) {
          return output;
        }
        issues.push(...localContext.issues);

        i++;
        return handleInput();
      };

      return handleInput();
    }

    for (const type of _types) {
      const localContext = context.fork(true);
      const output = type._parse(input, localContext);

      if (localContext.valid) {
        return output;
      }
      issues.push(...localContext.issues);
    }

    context.raiseIssue(createIssue(context, 'union', input, issues));
    return input;
  }
}
