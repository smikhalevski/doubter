// export const checkOperationFactory: OperationCallbackFactory = (operation, next) => {
//   const { cb, param } = operation.payload;
//   const { isForced } = operation;
//
//   return (input, options, changed, issues, result) => {
//     if (isForced || issues === null) {
//       try {
//         const result = (cb as CheckCallback)(input, param, options);
//
//         if (isObjectLike(result)) {
//           if (issues !== null) {
//             if (isArray(result)) {
//               issues.push(...result);
//             } else {
//               issues.push(result);
//             }
//           } else {
//             issues = isArray(result) ? result.slice(0) : [result];
//           }
//           if (!options.verbose) {
//             return issues;
//           }
//         }
//       } catch (error) {
//         issues = concatIssues(issues, captureIssues(error));
//
//         if (!options.verbose) {
//           return issues;
//         }
//       }
//     }
//     if (next !== null) {
//       return next(input, options, changed, issues, result);
//     }
//     if (issues !== null) {
//       return issues;
//     }
//     if (!changed) {
//       return result;
//     }
//     if (result !== null) {
//       result.value = input;
//       return result;
//     }
//     return ok(input);
//   };
// };
//
// export const alterOperationFactory: OperationCallbackFactory = (operation, next) => {
//   const { cb, param } = operation.payload;
//
//   return (input, options, changed, issues, result) => {
//     let output = input;
//
//     if (issues === null) {
//       try {
//         output = (cb as AlterCallback)(input, param, options);
//       } catch (error) {
//         return concatIssues(issues, captureIssues(error));
//       }
//
//       if (!changed) {
//         changed = !isEqual(input, output);
//       }
//     }
//
//     if (next !== null) {
//       return next(output, options, changed, issues, result);
//     }
//     if (!changed) {
//       return result;
//     }
//     if (result !== null) {
//       result.value = output;
//       return result;
//     }
//     return ok(output);
//   };
// };

import { Ok, OperationCallback } from '../types';
import { isEqual } from './lang';

const result: Ok<any> = { ok: true, value: null };

export const terminalOpCb: OperationCallback = (input, output, options, issues) => {
  if (issues !== null) {
    return issues;
  }
  if (isEqual(input, output)) {
    return null;
  }
  result.value = output;
  return result;
};
