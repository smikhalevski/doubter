import { NeverType } from '../types';

/**
 * Creates the type definition that always raises an issue.
 */
export function never(): NeverType {
  return new NeverType();
}
