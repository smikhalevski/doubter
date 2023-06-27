import { OperationCallback } from '../types';
import { isEqual } from './lang';
import { ok } from './shapes';

export const terminalOperationCallback: OperationCallback = (input, output, options, issues) => {
  if (issues !== null) {
    return issues;
  }
  if (isEqual(input, output)) {
    return null;
  }
  return ok(output);
};
