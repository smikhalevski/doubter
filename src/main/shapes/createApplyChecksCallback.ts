import { CheckCallback, Issue, ParseOptions } from '../shared-types';
import { addIssue, captureIssues, concatIssues } from '../utils';

export type ApplyChecksCallback = (output: any, issues: Issue[] | null, options: ParseOptions) => Issue[] | null;

export interface Check {
  id: string | undefined;
  cb: CheckCallback<any>;
  unsafe: boolean;
}

export function createApplyChecksCallback(checks: Check[]): ApplyChecksCallback | null {
  const checksLength = checks.length;

  if (checksLength === 0) {
    return null;
  }

  if (checksLength === 1) {
    const [{ unsafe, cb }] = checks;

    return (output, issues, options) => {
      if (issues === null || unsafe) {
        let result;

        try {
          result = cb(output);
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
    const [{ unsafe: unsafe0, cb: cb0 }, { unsafe: unsafe1, cb: cb1 }] = checks;

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
      const { unsafe, cb } = checks[i];

      let result;

      if (issues !== null && !unsafe) {
        continue;
      }

      try {
        result = cb(output);
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
