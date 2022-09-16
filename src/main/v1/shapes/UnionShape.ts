import { InputConstraintOptions, Issue, Multiple, ParserOptions } from '../shared-types';
import { AnyShape, Shape } from './Shape';
import { captureIssues, createIssue, isAsync, isObjectLike, raiseOnIssues } from '../utils';
import { UNION_CODE } from './issue-codes';

const fastOptions: ParserOptions = { fast: true };

type InferUnion<U extends Multiple<AnyShape>, X extends 'input' | 'output'> = { [K in keyof U]: U[K][X] }[number];

export class UnionShape<U extends Multiple<AnyShape>> extends Shape<InferUnion<U, 'input'>, InferUnion<U, 'output'>> {
  constructor(protected shapes: U, protected options?: InputConstraintOptions) {
    super(isAsync(shapes));
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
        const issues = captureIssues(error);
        firstIssues ||= issues;
      }
      options = fastOptions;
    }

    let issues = [createIssue(input, UNION_CODE, firstIssues, this.options, 'Must conform a union')];

    raiseOnIssues(
      (isObjectLike(options) && options.fast) || applyConstraints === null
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

      const outputPromises = [];

      for (const shape of shapes) {
        outputPromises.push(shape.parseAsync(input, options));
      }

      resolve(
        Promise.allSettled(outputPromises).then(results => {
          let firstIssues: Issue[] | null = null;

          for (const result of results) {
            if (result.status === 'fulfilled') {
              return result.value;
            }
            const issues = captureIssues(result.reason);
            firstIssues ||= issues;
          }

          let issues = [createIssue(input, UNION_CODE, firstIssues, this.options, 'Must conform a union')];

          raiseOnIssues(
            (isObjectLike(options) && options.fast) || applyConstraints === null
              ? issues
              : applyConstraints(input, options, issues)
          );
        })
      );
    });
  }
}
