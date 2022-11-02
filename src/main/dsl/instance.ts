import { InstanceShape } from '../shapes';
import { Message, TypeConstraintOptions } from '../shared-types';

/**
 * Creates the class instance shape.
 *
 * @template F The instance constructor.
 */
export function instance<C extends new (...args: any[]) => any>(
  ctor: C,
  options?: TypeConstraintOptions | Message
): InstanceShape<C> {
  return new InstanceShape(ctor, options);
}
