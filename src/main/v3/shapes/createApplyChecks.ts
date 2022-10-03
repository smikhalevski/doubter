import { Ok, okSync, ValidationError } from './Shape';
import { Check, Issue } from '../shared-types';
import { isArray } from '../lang-utils';

export type ApplyChecks = (
  output: any,
  issues: Issue[] | null,
  deviated: boolean,
  valid: boolean,
  earlyReturn: boolean
) => Ok<any> | Issue[] | null;

export function createApplyChecks(checks: any[]): ApplyChecks | null {
  const checksLength = checks.length;

  if (checksLength === 0) {
    return null;
  }

  if (checksLength === 3) {
    const [, unsafe0, check0] = checks;

    return (output, issues, deviated, valid, earlyReturn) => {
      if (valid || unsafe0) {
        let result: ReturnType<Check<unknown>>;

        try {
          result = check0(output);
        } catch (error) {
          return pushIssue(issues, getErrorIssues(error));
        }
        if (result != null) {
          return pushIssue(issues, result);
        }
      }
      return issues === null && deviated ? okSync(output) : issues;
    };
  }

  if (checksLength === 6) {
    const [, unsafe0, check0, , unsafe1, check1] = checks;

    return (output, issues, deviated, valid, earlyReturn) => {
      if (valid || unsafe0) {
        let result: ReturnType<Check<unknown>>;

        try {
          result = check0(output);
        } catch (error) {
          valid = false;
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

      if (valid || unsafe1) {
        let result: ReturnType<Check<unknown>>;

        try {
          result = check1(output);
        } catch (error) {
          issues = pushIssue(issues, getErrorIssues(error));
        }
        if (result != null) {
          issues = pushIssue(issues, result);
        }
      }

      return issues === null && deviated ? okSync(output) : issues;
    };
  }

  return (output, issues, deviated, valid, earlyReturn) => {
    for (let i = 1; i < checksLength; i += 3) {
      let result: ReturnType<Check<unknown>>;

      if (!valid && !checks[i]) {
        continue;
      }

      const check = checks[i + 1];

      try {
        result = check(output);
      } catch (error) {
        valid = false;
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

    return issues === null && deviated ? okSync(output) : issues;
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
