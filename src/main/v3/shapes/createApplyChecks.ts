import { IParserContext, Ok, ok } from './Shape';
import { Check, Issue } from '../shared-types';
import { isArray } from '../lang-utils';
import { ValidationError } from './ValidationError';

export type ApplyChecks = (output: any, context: IParserContext) => Ok<any> | boolean;

// export function createApplyChecks(checks: any[]): ApplyChecks | null {
//   const checksLength = checks.length;
//
//   if (checksLength === 0) {
//     return null;
//   }
//
//   if (checksLength === 3) {
//     const [, unsafe0, check0] = checks;
//
//     return (output, issues, transformed, valid, earlyReturn) => {
//       if (valid || unsafe0) {
//         let result: ReturnType<Check<unknown>>;
//
//         try {
//           result = check0(output);
//         } catch (error) {
//           return addIssue(issues, getErrorIssues(error));
//         }
//         if (result != null) {
//           return addIssue(issues, result);
//         }
//       }
//       return issues === null && transformed ? ok(output) : issues;
//     };
//   }
//
//   if (checksLength === 6) {
//     const [, unsafe0, check0, , unsafe1, check1] = checks;
//
//     return (output, issues, deviated, valid, earlyReturn) => {
//       if (valid || unsafe0) {
//         let result: ReturnType<Check<unknown>>;
//
//         try {
//           result = check0(output);
//         } catch (error) {
//           valid = false;
//           issues = addIssue(issues, getErrorIssues(error));
//
//           if (earlyReturn) {
//             return issues;
//           }
//         }
//         if (result != null) {
//           valid = false;
//           issues = addIssue(issues, result);
//
//           if (earlyReturn) {
//             return issues;
//           }
//         }
//       }
//
//       if (valid || unsafe1) {
//         let result: ReturnType<Check<unknown>>;
//
//         try {
//           result = check1(output);
//         } catch (error) {
//           issues = addIssue(issues, getErrorIssues(error));
//         }
//         if (result != null) {
//           issues = addIssue(issues, result);
//         }
//       }
//
//       return issues === null && deviated ? ok(output) : issues;
//     };
//   }
//
//   return (output, issues, deviated, valid, earlyReturn) => {
//     for (let i = 1; i < checksLength; i += 3) {
//       let result: ReturnType<Check<unknown>>;
//
//       if (!valid && !checks[i]) {
//         continue;
//       }
//
//       const check = checks[i + 1];
//
//       try {
//         result = check(output);
//       } catch (error) {
//         valid = false;
//         issues = addIssue(issues, getErrorIssues(error));
//
//         if (earlyReturn) {
//           return issues;
//         }
//       }
//
//       if (result != null) {
//         valid = false;
//         issues = addIssue(issues, result);
//
//         if (earlyReturn) {
//           return issues;
//         }
//       }
//     }
//
//     return issues === null && deviated ? ok(output) : issues;
//   };
// }
//
// function getErrorIssues(error: unknown): Issue[] {
//   if (error instanceof ValidationError) {
//     return error.issues;
//   }
//   throw error;
// }
//
// function addIssue(issues: Issue[] | null, issue: Issue[] | Issue): Issue[] {
//   if (isArray(issue)) {
//     if (issues === null) {
//       issues = issue;
//     } else {
//       issues.push(...issue);
//     }
//   } else {
//     if (issues === null) {
//       issues = [issue];
//     } else {
//       issues.push(issue);
//     }
//   }
//   return issues;
// }
