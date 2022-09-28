import { InputConstraintOptionsOrMessage, INVALID, Issue, ParserOptions, Tuple } from '../shared-types';
import { AnyShape, Shape } from './Shape';
import {
  createIssue,
  isAsyncShapes,
  isEarlyReturn,
  isValidationError,
  returnOrRaiseIssues,
  throwIfUnknownError,
} from '../utils';
import { CODE_UNION, MESSAGE_UNION } from './constants';
import { ValidationError } from '../ValidationError';

type InferUnion<U extends Tuple<AnyShape>, C extends 'input' | 'output'> = { [K in keyof U]: U[K][C] }[number];

/**
 * The shape that requires an input to conform at least one of the united shapes.
 *
 * @template U The list of united type definitions.
 */
export class UnionShape<U extends Tuple<AnyShape>> extends Shape<InferUnion<U, 'input'>, InferUnion<U, 'output'>> {
  /**
   * Creates a new {@linkcode UnionShape} instance.
   *
   * @param shapes The list of united shapes.
   * @param options The constraint options or an issue message.
   */
  constructor(readonly shapes: Readonly<U>, protected options?: InputConstraintOptionsOrMessage) {
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
    return new UnionShape(childShapes as U);
  }

  safeParse(input: unknown, options?: ParserOptions): InferUnion<U, 'output'> | ValidationError {
    const { shapes, _applyConstraints } = this;

    const shapesLength = shapes.length;

    let issues: Issue[] | null = null;

    for (let i = 0; i < shapesLength; ++i) {
      let output = INVALID;
      try {
        output = shapes[i].parse(input, options);
      } catch (error) {
        issues = captureOrMergeIssues(issues, error);
      }
      if (isValidationError(output)) {
        issues = captureOrMergeIssues(issues, output);
        continue;
      }
      return output;
    }

    issues = [createIssue(input, CODE_UNION, issues, this.options, MESSAGE_UNION)];

    return returnOrRaiseIssues(
      input,
      isEarlyReturn(options) || _applyConstraints === null ? issues : _applyConstraints(input, options, issues)
    );
  }

  safeParseAsync(input: unknown, options?: ParserOptions): Promise<InferUnion<U, 'output'> | ValidationError> {
    if (!this.async) {
      return super.safeParseAsync(input, options);
    }

    const { shapes, _applyConstraints } = this;

    const shapesLength = shapes.length;

    let issues: Issue[] | null = null;
    let promise = shapes[0].safeParseAsync(input, options);

    for (let i = 1; i < shapesLength; ++i) {
      promise = promise.catch(error => {
        issues = captureOrMergeIssues(issues, error);

        return shapes[i].parseAsync(input, options);
      });
    }

    return promise.catch(error => {
      throwIfUnknownError(error);

      issues = [createIssue(input, CODE_UNION, issues, this.options, MESSAGE_UNION)];

      return returnOrRaiseIssues(
        input,
        isEarlyReturn(options) || _applyConstraints === null ? issues : _applyConstraints(input, options, issues)
      );
    });
  }
}

function captureOrMergeIssues(issues: Issue[] | null, error: unknown): Issue[] {
  throwIfUnknownError(error);

  const errorIssues = error.issues;

  if (issues !== null) {
    issues.push(...errorIssues);
    return issues;
  }
  return errorIssues;
}
