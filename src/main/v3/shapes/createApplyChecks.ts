import { Ok, syncOk, ValidationError } from './Shape';
import { Check, Issue } from '../shared-types';
import { isArray } from '../lang-utils';

export type ApplyChecks = (
  output: any,
  issues: Issue[] | null,
  deviated: boolean,
  valid: boolean,
  earlyReturn: boolean
) => Ok<any> | Issue[] | null;

export function createApplyChecks(checks: any[]): ApplyChecks {
  const checksLength = checks.length;

  return (output, issues, deviated, valid, earlyReturn) => {
    let result: ReturnType<Check<unknown>>;

    for (let i = 1; i < checksLength; i += 3) {
      if (!valid && !checks[i]) {
        continue;
      }

      try {
        result = checks[i + 1](output);
      } catch (error) {
        issues = pushIssue(issues, getErrorIssues(error));

        if (earlyReturn) {
          return issues;
        }
      }

      if (result != null) {
        valid = false;
        issues = pushIssue(issues, result);

        if (earlyReturn) {
          return issues;
        }
      }
    }

    return issues === null && deviated ? syncOk(output) : issues;
  };
}

function isValidationError(error: unknown): error is ValidationError {
  return error instanceof ValidationError;
}

function getErrorIssues(error: unknown): Issue[] {
  if (!isValidationError(error)) {
    throw error;
  }
  return error.issues;
}

function pushIssue(issues: Issue[] | null, result: Issue[] | Issue): Issue[] {
  if (isArray(result)) {
    if (issues === null) {
      issues = result;
    } else {
      issues.push(...result);
    }
  } else {
    if (issues === null) {
      issues = [result];
    } else {
      issues.push(result);
    }
  }
  return issues;
}
