import { AnyShape, DeepPartialProtocol, DeepPartialShape, Shape } from '../shape/Shape';
import { ApplyOptions, Issue, Ok, OperationCallback, ParseOptions, Result } from '../types';
import { ValidationError } from '../ValidationError';
import { isArray, isEqual, isObjectLike } from './lang';

export const defaultApplyOptions = Object.freeze<ApplyOptions>({ earlyReturn: false, coerce: false });

export const INPUT = Symbol();
export const OUTPUT = Symbol();

export type INPUT = typeof INPUT;
export type OUTPUT = typeof OUTPUT;

let nonce = -1;

export function nextNonce(): number {
  nonce = (nonce + 1) | 0;
  return nonce;
}

// For test purposes only
export function resetNonce(): void {
  nonce = -1;
}

export function ok<T>(value: T): Ok<T> {
  return { ok: true, value };
}

export const universalApplyOperations: OperationCallback = (input, output, options, issues) => {
  if (issues !== null) {
    return issues;
  }
  if (isEqual(input, output)) {
    return null;
  }
  return ok(output);
};

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
 * Copies checks from `baseShape` to `shape`.
 */
export function copyOperations<S extends Shape>(baseShape: Shape, shape: S): S {
  shape.operations = baseShape.operations;
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
 * Prepends a key to a path of each issue.
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
