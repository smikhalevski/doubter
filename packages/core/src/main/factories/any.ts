import { UnconstrainedType } from '../types';

export function any(): UnconstrainedType<any> {
  return new UnconstrainedType();
}
