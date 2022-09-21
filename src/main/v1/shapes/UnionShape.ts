import { InputConstraintOptions, Issue, ParserOptions } from '../shared-types';
import { AnyShape, Shape } from './Shape';
import { captureIssues, createIssue, isAsyncShapes, raise, raiseIfIssues, raiseIfUnknownError } from '../utils';
import { UNION_CODE } from './issue-codes';

type InferUnion<U extends AnyShape[], C extends 'input' | 'output'> = { [K in keyof U]: U[K][C] }[number];

export class UnionShape<U extends AnyShape[]> extends Shape<InferUnion<U, 'input'>, InferUnion<U, 'output'>> {
  constructor(protected shapes: U, protected options?: InputConstraintOptions) {
    super(isAsyncShapes(shapes));

    if (shapes.length === 0) {
      raise('Union expects at least one shape');
    }
  }

  at(key: unknown): AnyShape | null {
    const childShapes: AnyShape[] = [];

    for (const shape of this.shapes) {
      const childShape = shape.at(key);

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
    return new UnionShape(childShapes);
  }

  parse(input: unknown, options?: ParserOptions): InferUnion<U, 'output'> {
    const { shapes, applyConstraints } = this;

    const shapesLength = shapes.length;

    let issues: Issue[] | null = null;

    for (let i = 0; i < shapesLength; ++i) {
      try {
        return shapes[i].parse(input, options);
      } catch (error) {
        issues = captureIssues(issues, error);
      }
    }

    issues = [createIssue(input, UNION_CODE, issues, this.options, 'Must conform a union')];

    raiseIfIssues(
      shapesLength === 0 || (options !== undefined && options.fast) || applyConstraints === null
        ? issues
        : applyConstraints(input, options, issues)
    );
  }

  parseAsync(input: unknown, options?: ParserOptions): Promise<InferUnion<U, 'output'>> {
    if (!this.async) {
      return super.parseAsync(input, options);
    }

    const { shapes, applyConstraints } = this;

    const shapesLength = shapes.length;

    let issues: Issue[] | null = null;
    let promise = shapes[0].parseAsync(input, options);

    for (let i = 1; i < shapesLength; ++i) {
      promise = promise.catch(error => {
        issues = captureIssues(issues, error);

        return shapes[i].parseAsync(input, options);
      });
    }

    return promise.catch(error => {
      raiseIfUnknownError(error);

      issues = [createIssue(input, UNION_CODE, issues, this.options, 'Must conform a union')];

      raiseIfIssues(
        (options !== undefined && options.fast) || applyConstraints === null
          ? issues
          : applyConstraints(input, options, issues)
      );
    });
  }
}
