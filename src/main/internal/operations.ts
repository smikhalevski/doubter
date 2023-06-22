import { Result } from '../shape';
import { ApplyOptions, Issue, Operation } from '../types';
import { isArray, isEqual, isObjectLike } from './lang';
import { captureIssues, concatIssues, ok } from './shapes';

export type ApplyOperations = (input: any, issues: Issue[] | null, options: ApplyOptions, changed: boolean) => Result;

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
      cb = (input, issues, options, changed) => {
        if (issues !== null) {
          return issues;
        }

        let output;
        try {
          output = apply(input, payload, options);
        } catch (error) {
          return concatIssues(issues, captureIssues(error));
        }

        changed = changed || !isEqual(input, output);

        if (next !== null) {
          return next(output, null, options, changed);
        }
        if (changed) {
          return ok(output);
        }
        return null;
      };
    }

    if (operation.type === 'check') {
      const { isForced } = operation;

      cb = (value, issues, options, changed) => {
        if (isForced || issues === null) {
          try {
            const result = apply(value, payload, options);

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
          return next(value, issues, options, changed);
        }
        if (changed && issues === null) {
          return ok(value);
        }
        return issues;
      };
    }
  }

  return cb;
}
