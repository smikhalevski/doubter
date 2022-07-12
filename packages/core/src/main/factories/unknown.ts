import { UnconstrainedType } from '../types';

export function unknown(): UnconstrainedType<unknown> {
  return new UnconstrainedType();
}
