import { InputConstraintOptions, Issue, Multiple, ParserOptions } from '../shared-types';
import { AnyShape, Shape } from './Shape';
import { createIssue, isAsyncShapes, raiseIfIssues, raiseIfUnknownError } from '../utils';
import { UNION_CODE } from './issue-codes';

const fastOptions: ParserOptions = { fast: true };

type InferUnion<U extends Multiple<AnyShape>, X extends 'input' | 'output'> = { [K in keyof U]: U[K][X] }[number];

export class UnionShape<U extends Multiple<AnyShape>> extends Shape<InferUnion<U, 'input'>, InferUnion<U, 'output'>> {
  constructor(protected shapes: U, protected options?: InputConstraintOptions) {
    super(isAsyncShapes(shapes));
  }

  at(key: unknown): AnyShape | null {
    const childShapes: AnyShape[] = [];

    for (const type of this.shapes) {
      const childShape = type.at(key);

      if (childShape !== null) {
        childShapes.push(childShape);
      }
    }
    if (childShapes.length === 0) {
      return null;
    }
    if (childShapes.length === 1) {
      return childShapes[0];
    }
    return new UnionShape(childShapes as Multiple<AnyShape>);
  }

  parse(input: unknown, options?: ParserOptions): InferUnion<U, 'output'> {
    const { shapes, applyConstraints } = this;

    let firstIssues: Issue[] | null = null;
    for (const shape of shapes) {
      try {
        return shape.parse(input, options);
      } catch (error) {
        raiseIfUnknownError(error);
        firstIssues ||= error.issues;
      }
      options = fastOptions;
    }

    let issues = [createIssue(input, UNION_CODE, firstIssues, this.options, 'Must conform a union')];

    raiseIfIssues(
      (options !== undefined && options.fast) || applyConstraints === null
        ? issues
        : applyConstraints(input, options, issues)
    );
  }

  parseAsync(input: unknown, options?: ParserOptions): Promise<InferUnion<U, 'output'>> {
    if (!this.async) {
      return super.parseAsync(input, options);
    }

    return new Promise(resolve => {
      const { shapes, applyConstraints } = this;

      const promises = [];

      for (const shape of shapes) {
        promises.push(shape.parseAsync(input, options));
      }

      resolve(
        Promise.allSettled(promises).then(results => {
          let firstIssues: Issue[] | null = null;

          for (const result of results) {
            if (result.status === 'fulfilled') {
              return result.value;
            }
            raiseIfUnknownError(result.reason);
            firstIssues ||= result.reason.issues;
          }

          let issues = [createIssue(input, UNION_CODE, firstIssues, this.options, 'Must conform a union')];

          raiseIfIssues(
            (options !== undefined && options.fast) || applyConstraints === null
              ? issues
              : applyConstraints(input, options, issues)
          );
        })
      );
    });
  }
}
