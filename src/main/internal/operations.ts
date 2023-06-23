import { ERROR_UNKNOWN_OPERATION } from '../constants';
import { AlterCallback, ApplyOperation, ApplyOperationFactory, CheckCallback, Operation } from '../types';
import { isArray, isEqual, isObjectLike } from './lang';
import { captureIssues, concatIssues, ok } from './shapes';

/**
 * Composes multiple operations into a single operation callback.
 */
export function createOperationCallback(
  factories: Map<any, ApplyOperationFactory>,
  operations: readonly Operation[]
): ApplyOperation | null {
  let cb: ApplyOperation | null = null;

  for (let i = operations.length - 1; i >= 0; --i) {
    const operation = operations[i];
    const factory = factories.get(operation.type);

    if (factory === undefined) {
      throw new Error(ERROR_UNKNOWN_OPERATION + operation.type);
    }
    cb = factory(operation, cb);
  }
  return cb;
}

export const checkOperationCallbackFactory: ApplyOperationFactory = (operation, next) => {
  const { cb, param } = operation.payload;
  const { isForced } = operation;

  return (input, options, changed, issues, result) => {
    if (isForced || issues === null) {
      try {
        const result = (cb as CheckCallback)(input, param, options);

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
      return next(input, options, changed, issues, result);
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
};

export const alterOperationCallbackFactory: ApplyOperationFactory = (operation, next) => {
  const { cb, param } = operation.payload;

  return (input, options, changed, issues, result) => {
    let output = input;

    if (issues === null) {
      try {
        output = (cb as AlterCallback)(input, param, options);
      } catch (error) {
        return concatIssues(issues, captureIssues(error));
      }

      if (!changed) {
        changed = !isEqual(input, output);
      }
    }

    if (next !== null) {
      return next(output, options, changed, issues, result);
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
};
