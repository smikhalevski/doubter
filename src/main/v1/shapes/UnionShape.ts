import { InputConstraintOptions, Issue, Multiple, ParserOptions } from '../shared-types';
import { AnyShape, Shape } from './Shape';
import { applyConstraints, captureIssues, createError, isAsync } from '../utils';
import { UNION_CODE } from './issue-codes';

const fastOptions: ParserOptions = { fast: true };

type InferUnion<U extends Multiple<AnyShape>, X extends 'input' | 'output'> = { [K in keyof U]: U[K][X] }[number];

export class UnionShape<U extends Multiple<AnyShape>> extends Shape<InferUnion<U, 'input'>, InferUnion<U, 'output'>> {
  constructor(protected shapes: U, protected options?: InputConstraintOptions) {
    super(isAsync(shapes));
  }

  at(propertyName: unknown): AnyShape | null {
    const childShapes: AnyShape[] = [];

    for (const type of this.shapes) {
      const childShape = type.at(propertyName);

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
    const { shapes, constraints } = this;

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

    let rootError = createError(input, UNION_CODE, firstIssues, this.options, 'Must conform a union');

    if (options != null && options.fast) {
      throw rootError;
    }
    if (constraints !== null) {
      rootError = applyConstraints(input, constraints, options, rootError);
    }
    throw rootError;
  }

  parseAsync(input: unknown, options?: ParserOptions): Promise<InferUnion<U, 'output'>> {
    if (!this.async) {
      return super.parseAsync(input, options);
    }

    return new Promise(resolve => {
      const { shapes, constraints } = this;

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

          let rootError = createError(input, UNION_CODE, firstIssues, this.options, 'Must conform a union');

          if (options != null && options.fast) {
            throw rootError;
          }
          if (constraints !== null) {
            rootError = applyConstraints(input, constraints, options, rootError);
          }
          throw rootError;
        })
      );
    });
  }
}
