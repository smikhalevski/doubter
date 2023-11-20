import { ERR_SYNC_UNSUPPORTED } from '../constants';
import type { AnyShape, DeepPartialProtocol, DeepPartialShape, Shape } from '../shape/Shape';
import { ApplyOptions, CheckResult, Issue, Ok, Operation, OperationCallback, ParseOptions, Result } from '../typings';
import { ValidationError } from '../ValidationError';
import { freeze, isArray, isEqual, isObjectLike } from './lang';

// Copied to support TS prior to v4.5
// prettier-ignore
type Awaited<T> =
  T extends null | undefined ? T :
  T extends object & { then(fn: infer F, ...args: any): any } ?
  F extends (value: infer V, ...args: any) => any ? Awaited<V> : never :
  T;

export type Promisify<T> = Promise<Awaited<T>>;

export type Awaitable<T> = Awaited<T> extends T ? Promise<T> | T : T;

/**
 * A callback that applies operations to the shape output.
 *
 * @param input The input value to which the shape was applied.
 * @param output The shape output value to which the operation must be applied.
 * @param options Parsing options.
 * @param issues The mutable array of issues captured by a shape, or `null` if there were no issues raised yet.
 * @returns The result of the operation.
 * @template ReturnValue The cumulative result of applied operations.
 * @group Operations
 */
type ApplyOperationsCallback = (
  input: unknown,
  output: unknown,
  options: ApplyOptions,
  issues: Issue[] | null
) => Result | Promise<Result>;

export const defaultApplyOptions = freeze<ApplyOptions>({ earlyReturn: false });

export declare const INPUT: unique symbol;
export declare const OUTPUT: unique symbol;

export type INPUT = typeof INPUT;
export type OUTPUT = typeof OUTPUT;

/**
 * Nonce is required to distinguish parallel invocations of async parsing.
 */
let nonce = -1;

export function nextNonce(): number {
  return ++nonce;
}

/**
 * For test purposes only!
 */
export function resetNonce(): void {
  nonce = -1;
}

export function ok<T>(value: T): Ok<T> {
  return { ok: true, value };
}

export function isAsyncShapes(shapes: readonly AnyShape[] | null | undefined): boolean {
  if (shapes !== null && shapes !== undefined) {
    for (const shape of shapes) {
      if (shape.isAsync) {
        return true;
      }
    }
  }
  return false;
}

/**
 * Converts the shape to its deep partial alternative if shape implements {@link DeepPartialProtocol}, or returns
 * the shape as is.
 */
export function toDeepPartialShape<S extends AnyShape & Partial<DeepPartialProtocol<any>>>(
  shape: S
): DeepPartialShape<S> {
  return typeof shape.deepPartial === 'function' ? shape.deepPartial() : shape;
}

/**
 * Calls `Shape._apply` or `Shape._applyAsync` depending on `Shape.isAsync`, and passes the result to `cb` after it
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

export function concatIssues(issues: Issue[] | null, otherIssues: Issue[]): Issue[] {
  if (issues === null) {
    return otherIssues;
  }
  issues.push(...otherIssues);
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
  const message = options?.errorMessage;

  if (typeof message === 'function') {
    return message(issues, input);
  }
  if (message !== undefined) {
    return String(message);
  }
}

/**
 * Copies operations from `baseShape` to `shape`.
 */
export function copyOperations<S extends Shape>(baseShape: Shape, shape: S): S {
  shape.operations = baseShape.operations;
  return shape;
}

export const universalApplyOperations: ApplyOperationsCallback = (input, output, options, issues) => {
  if (issues !== null) {
    return issues;
  }
  if (isEqual(input, output)) {
    return null;
  }
  return ok(output);
};

/**
 * Creates the callback that applies the operation and passes control to the next operation.
 *
 * @param operation The operation to apply.
 * @param next The callback that applies the next operation.
 * @param async If `true` then both operation and next operation are called asynchronously.
 * @returns The callback that applies the operation.
 */
export function createApplyOperations(
  operation: Operation,
  next: ApplyOperationsCallback,
  async: boolean
): ApplyOperationsCallback {
  const { param, isRequired, callback } = operation;

  if (async) {
    return (input, output, options, issues) =>
      new Promise<Result>(resolve => {
        resolve(callback(output, param, options));
      })
        .catch(captureIssues)
        .then(result => {
          if (result !== null) {
            if (isArray(result)) {
              issues = concatIssues(issues, result);

              if (isRequired || options.earlyReturn) {
                return issues;
              }
            } else {
              output = result.value;
            }
          }
          return next(input, output, options, issues);
        });
  }

  return (input, output, options, issues) => {
    let result;

    try {
      result = (callback as OperationCallback<Result>)(output, param, options);
    } catch (error) {
      result = captureIssues(error);
    }
    if (result !== null) {
      if (isArray(result)) {
        issues = concatIssues(issues, result);

        if (isRequired || options.earlyReturn) {
          return issues;
        }
      } else {
        output = result.value;
      }
    }
    return next(input, output, options, issues);
  };
}

export function extractCheckResult(result: CheckResult): Result {
  if (!isObjectLike(result)) {
    return null;
  }
  if (isArray(result)) {
    return result.length === 0 ? null : result;
  }
  return [result];
}

export function throwSyncUnsupported(): never {
  throw new Error(ERR_SYNC_UNSUPPORTED);
}
