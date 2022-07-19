import { UnconstrainedType } from '../types';

export function never(): UnconstrainedType<never> {
  return new UnconstrainedType();
}
