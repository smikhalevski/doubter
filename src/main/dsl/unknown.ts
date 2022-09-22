import { UnconstrainedShape } from '../shapes';

export function unknown(): UnconstrainedShape<unknown> {
  return new UnconstrainedShape();
}
