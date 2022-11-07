import { Check, Issue, ParseOptions } from '../shared-types';
import { addIssue, captureIssues, concatIssues } from '../utils';

export type ApplyChecksCallback = (output: any, issues: Issue[] | null, options: ParseOptions) => Issue[] | null;

export function createApplyChecksCallback(checks: Check[]): ApplyChecksCallback | null {
  const checksLength = checks.length;

  if (checksLength === 0) {
    return null;
  }

  if (checksLength === 1) {
    const [{ unsafe, checker }] = checks;

    return (output, issues, options) => {
      if (issues === null || unsafe) {
        let result;

        try {
          result = checker(output);
        } catch (error) {
          return concatIssues(issues, captureIssues(error));
        }
        if (result != null) {
          return addIssue(issues, result);
        }
      }
      return issues;
    };
  }

  if (checksLength === 2) {
    const [{ unsafe: unsafe0, checker: cb0 }, { unsafe: unsafe1, checker: cb1 }] = checks;

    return (output, issues, options) => {
      if (issues === null || unsafe0) {
        let result;

        try {
          result = cb0(output);
        } catch (error) {
          issues = concatIssues(issues, captureIssues(error));

          if (!options.verbose) {
            return issues;
          }
        }
        if (result != null) {
          issues = addIssue(issues, result);

          if (!options.verbose) {
            return issues;
          }
        }
      }

      if (issues === null || unsafe1) {
        let result;

        try {
          result = cb1(output);
        } catch (error) {
          issues = concatIssues(issues, captureIssues(error));
        }
        if (result != null) {
          issues = addIssue(issues, result);
        }
      }

      return issues;
    };
  }

  return (output, issues, options) => {
    for (let i = 1; i < checksLength; ++i) {
      const { unsafe, checker } = checks[i];

      let result;

      if (issues !== null && !unsafe) {
        continue;
      }

      try {
        result = checker(output);
      } catch (error) {
        issues = concatIssues(issues, captureIssues(error));

        if (!options.verbose) {
          return issues;
        }
      }

      if (result != null) {
        issues = addIssue(issues, result);

        if (!options.verbose) {
          return issues;
        }
      }
    }

    return issues;
  };
}
