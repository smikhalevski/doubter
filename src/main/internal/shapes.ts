import { AnyShape, DeepPartialProtocol, DeepPartialShape, Shape } from '../shape/Shape';
import { ApplyOptions, Issue, Ok, ParseOptions, Result } from '../types';
import { ValidationError } from '../ValidationError';
import { isArray, isObjectLike } from './lang';

export function nextNonce(): number {
  return nextNonce.nonce++;
}

nextNonce.nonce = 0;

export const okResult: Ok<any> = { ok: true, value: null };

export function ok<T>(value: T): Ok<T> {
  okResult.value = value;
  return okResult;
}

export function isAsyncShape(shape: AnyShape): boolean {
  return shape.isAsync;
}

export function getShapeInputs(shape: AnyShape): readonly unknown[] {
  return shape.inputs;
}

/**
 * Converts the shape to its deep partial alternative if shape implements {@linkcode DeepPartialProtocol}, or returns
 * the shape as is.
 */
export function toDeepPartialShape<S extends AnyShape>(shape: S): DeepPartialShape<S> {
  return 'deepPartial' in shape && typeof shape.deepPartial === 'function' ? shape.deepPartial() : shape;
}

/**
 * Replaces checks of the target shape with forced checks from the source shape.
 */
export function copyUnsafeChecks<S extends Shape>(sourceShape: Shape, targetShape: S): S {
  return targetShape;
}

/**
 * Replaces checks of `shape` with checks from the `baseShape` that match a predicate.
 */
export function copyChecks<S extends Shape>(baseShape: Shape, shape: S): S {
  return shape;
}

/**
 * Calls `Shape._apply` or `Shape._applyAsync` depending on `Shape._isAsync`, and passes the result to `cb` after it
 * becomes available.
 */
export function applyShape<T>(
  shape: AnyShape,
  input: unknown,
  options: ApplyOptions,
  nonce: number,
  cb: (result: Result) => T
): T | Promise<Awaited<T>> {
  if (shape.isAsync) {
    return shape['_applyAsync'](input, options, nonce).then(cb) as Promise<Awaited<T>>;
  } else {
    return cb(shape['_apply'](input, options, nonce));
  }
}

/**
 * Prepends a kind to a path of each issue.
 */
export function unshiftIssuesPath(issues: Issue[], key: unknown): void {
  for (const issue of issues) {
    if (isArray(issue.path)) {
      issue.path.unshift(key);
    } else {
      issue.path = [key];
    }
  }
}

export function concatIssues(issues: Issue[] | null, result: Issue[]): Issue[] {
  if (issues === null) {
    return result;
  }
  issues.push(...result);
  return issues;
}

export function pushIssue(issues: Issue[] | null, result: Issue): Issue[] {
  if (issues === null) {
    return [result];
  }
  issues.push(result);
  return issues;
}

export function captureIssues(error: unknown): Issue[] {
  if (error instanceof ValidationError) {
    return error.issues;
  }
  throw error;
}

/**
 * Returns an error message that is composed of the captured issues and parsing options.
 */
export function getErrorMessage(
  issues: Issue[],
  input: unknown,
  options: ParseOptions | undefined
): string | undefined {
  if (!isObjectLike(options)) {
    return;
  }

  const { errorMessage } = options;

  if (typeof errorMessage === 'function') {
    return errorMessage(issues, input);
  }
  if (errorMessage !== undefined) {
    return String(errorMessage);
  }
}
