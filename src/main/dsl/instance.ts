import { InstanceShape } from '../shapes';
import { Message, TypeCheckOptions } from '../shared-types';

/**
 * Creates the class instance shape.
 *
 * @template F The instance constructor.
 */
export function instance<C extends new (...args: any[]) => any>(
  ctor: C,
  options?: TypeCheckOptions | Message
): InstanceShape<C> {
  return new InstanceShape(ctor, options);
}
