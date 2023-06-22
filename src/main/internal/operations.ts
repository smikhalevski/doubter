import { Result } from '../shape';
import { ApplyOptions, Issue, Ok, Operation } from '../types';
import { isArray, isEqual, isObjectLike } from './lang';
import { captureIssues, concatIssues, ok } from './shapes';

// input
// options
// issues
// changed: boolean | null
// ok: OK | null

export type ApplyOperations = (
  input: any,
  issues: Issue[] | null,
  options: ApplyOptions,
  changed: boolean,
  result: Ok<any> | null
) => Result;

/**
 * Composes a processor that applies operations sequentially.
 *
 * @param operations The array of operation the processor should apply.
 */
export function createApplyOperations(operations: readonly Operation[]): ApplyOperations | null {
  let cb: ApplyOperations | null = null;

  for (let i = operations.length - 1, next: ApplyOperations | null = null; i >= 0; --i, next = cb) {
    const operation = operations[i];
    const { apply, payload } = operation;

    if (operation.type === 'alter') {
      cb = (input, issues, options, changed, result) => {
        if (issues !== null) {
          return issues;
        }

        let output;
        try {
          output = apply(input, payload, options);
        } catch (error) {
          return concatIssues(issues, captureIssues(error));
        }

        if (!changed) {
          changed = !isEqual(input, output);
        }
        if (next !== null) {
          return next(output, null, options, changed, result);
        }
        if (!changed) {
          return result;
        }
        if (result !== null) {
          result.value = output;
          return result;
        }
        return ok(output);
      };
    }

    if (operation.type === 'check') {
      const { isForced } = operation;

      cb = (input, issues, options, changed, result) => {
        if (isForced || issues === null) {
          try {
            const result = apply(input, payload, options);

            if (isObjectLike(result)) {
              if (issues !== null) {
                if (isArray(result)) {
                  issues.push(...result);
                } else {
                  issues.push(result);
                }
              } else {
                issues = isArray(result) ? result.slice(0) : [result];
              }
              if (!options.verbose) {
                return issues;
              }
            }
          } catch (error) {
            issues = concatIssues(issues, captureIssues(error));

            if (!options.verbose) {
              return issues;
            }
          }
        }
        if (next !== null) {
          return next(input, issues, options, changed, result);
        }
        if (issues !== null) {
          return issues;
        }
        if (!changed) {
          return result;
        }
        if (result !== null) {
          result.value = input;
          return result;
        }
        return ok(input);
      };
    }
  }

  return cb;
}
