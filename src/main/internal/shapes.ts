import { AnyShape, ApplyChecksCallback, DeepPartialProtocol, DeepPartialShape, Result, Shape } from '../shape/Shape';
import { ApplyOptions, Check, Issue, Ok, ParseOptions } from '../types';
import { ValidationError } from '../ValidationError';
import { isArray, isObjectLike } from './lang';

export function nextNonce(): number {
  return nextNonce.nonce++;
}

nextNonce.nonce = 0;

export function ok<T>(value: T): Ok<T> {
  return { ok: true, value };
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

export function isUnsafeCheck(check: Check): boolean {
  return check.isUnsafe;
}

/**
 * Returns the index of the check with the given key, or -1 if there's no such check.
 */
export function getCheckIndex(checks: readonly Check[], key: unknown): number {
  for (let i = 0; i < checks.length; ++i) {
    if (checks[i].key === key) {
      return i;
    }
  }
  return -1;
}

/**
 * Mutates the shape!
 *
 * Updates the shape checks and related properties.
 *
 * @param shape The shape to update.
 * @param checks The array of new checks.
 * @returns The clone of the shape.
 */
export function replaceChecks<S extends Shape>(shape: S, checks: readonly Check[]): S {
  shape['_checks'] = checks;
  shape['_applyChecks'] = createApplyChecksCallback(checks);
  shape['_isUnsafe'] = checks.some(isUnsafeCheck);

  return shape;
}

/**
 * Replaces checks of the target shape with unsafe checks from the source shape.
 */
export function copyUnsafeChecks<S extends Shape>(sourceShape: Shape, targetShape: S): S {
  return copyChecks(sourceShape, targetShape, isUnsafeCheck);
}

/**
 * Replaces checks of `shape` with checks from the `baseShape` that match a predicate.
 */
export function copyChecks<S extends Shape>(baseShape: Shape, shape: S, predicate?: (check: Check) => boolean): S {
  const checks = baseShape['_checks'];

  return replaceChecks(
    shape['_clone'](),
    checks.length !== 0 && predicate !== undefined ? checks.filter(predicate) : []
  );
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

export function captureIssues(error: unknown): Issue[] {
  if (error instanceof ValidationError) {
    return error.issues;
  }
  throw error;
}

/**
 * Creates the callback that applies given checks to a value.
 */
export function createApplyChecksCallback(checks: readonly Check[]): ApplyChecksCallback | null {
  const checksLength = checks.length;

  if (checksLength === 0) {
    return null;
  }

  if (checksLength === 1) {
    const [{ callback: cb0, param: param0, isUnsafe: isUnsafe0 }] = checks;

    return (output, issues, options) => {
      if (issues === null || isUnsafe0) {
        let result;

        try {
          result = cb0(output, param0, options);
        } catch (error) {
          return concatIssues(issues, captureIssues(error));
        }
        if (result !== null && result !== undefined) {
          return appendIssue(issues, result);
        }
      }
      return issues;
    };
  }

  if (checksLength === 2) {
    const [
      { callback: cb0, param: param0, isUnsafe: isUnsafe0 },
      { callback: cb1, param: param1, isUnsafe: isUnsafe1 },
    ] = checks;

    return (output, issues, options) => {
      if (issues === null || isUnsafe0) {
        let result;

        try {
          result = cb0(output, param0, options);
        } catch (error) {
          issues = concatIssues(issues, captureIssues(error));

          if (!options.verbose) {
            return issues;
          }
        }
        if (result !== null && result !== undefined) {
          issues = appendIssue(issues, result);

          if (issues !== null && !options.verbose) {
            return issues;
          }
        }
      }

      if (issues === null || isUnsafe1) {
        let result;

        try {
          result = cb1(output, param1, options);
        } catch (error) {
          issues = concatIssues(issues, captureIssues(error));
        }
        if (result !== null && result !== undefined) {
          issues = appendIssue(issues, result);
        }
      }

      return issues;
    };
  }

  return (output, issues, options) => {
    for (let i = 0; i < checksLength; ++i) {
      const { callback, param, isUnsafe } = checks[i];

      let result;

      if (issues !== null && !isUnsafe) {
        continue;
      }

      try {
        result = callback(output, param, options);
      } catch (error) {
        issues = concatIssues(issues, captureIssues(error));

        if (!options.verbose) {
          return issues;
        }
      }

      if (result !== null && result !== undefined) {
        issues = appendIssue(issues, result);

        if (issues !== null && !options.verbose) {
          return issues;
        }
      }
    }

    return issues;
  };
}

function appendIssue(issues: Issue[] | null, result: Issue[] | Issue): Issue[] | null {
  if (isArray(result)) {
    if (result.length !== 0) {
      if (issues === null) {
        issues = result;
      } else {
        issues.push(...result);
      }
    }
  } else if (isObjectLike(result)) {
    if (issues === null) {
      issues = [result];
    } else {
      issues.push(result);
    }
  }
  return issues;
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