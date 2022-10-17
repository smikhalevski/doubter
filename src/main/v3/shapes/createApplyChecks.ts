import { isArray } from '../lang-utils';
import { Check, Issue } from '../shared-types';
import { ValidationError } from './ValidationError';
import { concatIssues } from '../shape-utils';

export type ApplyChecks = (output: any, issues: Issue[] | null, earlyReturn: boolean) => Issue[] | null;

export function createApplyChecks(checks: any[]): ApplyChecks | null {
  const checksLength = checks.length;

  if (checksLength === 0) {
    return null;
  }

  if (checksLength === 3) {
    const [, unsafe0, check0] = checks;

    return (output, issues, earlyReturn) => {
      if (issues === null || unsafe0) {
        let result: ReturnType<Check<unknown>> = null;

        try {
          result = check0(output);
        } catch (error) {
          return concatIssues(issues, getErrorIssues(error));
        }
        if (result != null) {
          return addIssue(issues, result);
        }
      }
      return issues;
    };
  }

  if (checksLength === 6) {
    const [, unsafe0, check0, , unsafe1, check1] = checks;

    return (output, issues, earlyReturn) => {
      if (issues === null || unsafe0) {
        let result: ReturnType<Check<unknown>> = null;

        try {
          result = check0(output);
        } catch (error) {
          issues = concatIssues(issues, getErrorIssues(error));

          if (earlyReturn) {
            return issues;
          }
        }
        if (result != null) {
          issues = addIssue(issues, result);

          if (earlyReturn) {
            return issues;
          }
        }
      }

      if (issues === null || unsafe1) {
        let result: ReturnType<Check<unknown>> = null;

        try {
          result = check1(output);
        } catch (error) {
          issues = concatIssues(issues, getErrorIssues(error));
        }
        if (result != null) {
          issues = addIssue(issues, result);
        }
      }

      return issues;
    };
  }

  return (output, issues, earlyReturn) => {
    for (let i = 1; i < checksLength; i += 3) {
      let result: ReturnType<Check<unknown>> = null;

      if (issues !== null && !checks[i]) {
        continue;
      }

      const check: Check<any> = checks[i + 1];

      try {
        result = check(output);
      } catch (error) {
        issues = concatIssues(issues, getErrorIssues(error));

        if (earlyReturn) {
          return issues;
        }
      }

      if (result != null) {
        issues = addIssue(issues, result);

        if (earlyReturn) {
          return issues;
        }
      }
    }

    return issues;
  };
}

function getErrorIssues(error: unknown): Issue[] {
  if (error instanceof ValidationError) {
    return error.issues;
  }
  throw error;
}

function addIssue(issues: Issue[] | null, issue: Issue[] | Issue): Issue[] {
  if (isArray(issue)) {
    if (issues === null) {
      issues = issue;
    } else {
      issues.push(...issue);
    }
  } else {
    if (issues === null) {
      issues = [issue];
    } else {
      issues.push(issue);
    }
  }
  return issues;
}
