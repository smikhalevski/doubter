import { InputConstraintOptions, Issue, ParserOptions } from '../shared-types';
import { AnyShape, Shape } from './Shape';
import { createIssue, isAsyncShapes, raiseIfIssues, raiseIfUnknownError } from '../utils';
import { CODE_UNION, MESSAGE_UNION } from './constants';

type InferUnion<U extends AnyShape[], C extends 'input' | 'output'> = { [K in keyof U]: U[K][C] }[number];

/**
 * The shape that requires an input to conform at least one of the united shapes.
 *
 * @template U The list of united type definitions.
 */
export class UnionShape<U extends AnyShape[]> extends Shape<InferUnion<U, 'input'>, InferUnion<U, 'output'>> {
  /**
   * Creates a new {@linkcode UnionShape} instance.
   *
   * @param shapes The list of united shapes.
   * @param options The constraint options.
   */
  constructor(readonly shapes: Readonly<U>, protected options?: InputConstraintOptions) {
    super(isAsyncShapes(shapes));
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
        issues = captureOrMergeIssues(issues, error);
      }
    }

    issues = [createIssue(input, CODE_UNION, issues, this.options, MESSAGE_UNION)];

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

    const { shapes, applyConstraints } = this;

    const shapesLength = shapes.length;

    let issues: Issue[] | null = null;
    let promise = shapes[0].parseAsync(input, options);

    for (let i = 1; i < shapesLength; ++i) {
      promise = promise.catch(error => {
        issues = captureOrMergeIssues(issues, error);

        return shapes[i].parseAsync(input, options);
      });
    }

    return promise.catch(error => {
      raiseIfUnknownError(error);

      issues = [createIssue(input, CODE_UNION, issues, this.options, MESSAGE_UNION)];

      raiseIfIssues(
        (options !== undefined && options.fast) || applyConstraints === null
          ? issues
          : applyConstraints(input, options, issues)
      );
    });
  }
}

function captureOrMergeIssues(issues: Issue[] | null, error: unknown): Issue[] {
  raiseIfUnknownError(error);

  const errorIssues = error.issues;

  if (issues !== null) {
    issues.push(...errorIssues);
    return issues;
  }
  return errorIssues;
}
