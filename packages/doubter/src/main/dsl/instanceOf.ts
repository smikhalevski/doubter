import { InstanceShape } from '../shapes';
import { Message, TypeConstraintOptions } from '../shared-types';

/**
 * Creates the class instance shape.
 *
 * @param ctor The instance constructor.
 * @param options The constraint options or an issue message.
 * @template C The instance constructor.
 */
export function instanceOf<C extends new (...args: any[]) => any>(
  ctor: C,
  options?: TypeConstraintOptions | Message
): InstanceShape<C> {
  return new InstanceShape(ctor, options);
}
