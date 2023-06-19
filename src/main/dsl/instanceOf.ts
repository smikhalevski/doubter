import { InstanceShape } from '../shape';
import { ConstraintOptions, Message } from '../types';

/**
 * Creates the class instance shape.
 *
 * @param ctor The instance constructor.
 * @param options The constraint options or an issue message.
 * @template Ctor The instance constructor.
 */
export function instanceOf<Ctor extends new (...args: any[]) => any>(
  ctor: Ctor,
  options?: ConstraintOptions | Message
): InstanceShape<Ctor> {
  return new InstanceShape(ctor, options);
}
