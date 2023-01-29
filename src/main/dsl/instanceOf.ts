import { InstanceShape } from '../shapes';
import { ConstraintOptions, Message } from '../shared-types';

/**
 * Creates the class instance shape.
 *
 * @param ctor The instance constructor.
 * @param options The constraint options or an issue message.
 * @template C The instance constructor.
 */
export function instanceOf<C extends new (...args: any[]) => any>(
  ctor: C,
  options?: ConstraintOptions | Message
): InstanceShape<C> {
  return new InstanceShape(ctor, options);
}
