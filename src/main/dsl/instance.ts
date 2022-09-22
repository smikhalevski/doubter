import { InstanceShape } from '../shapes';
import { InputConstraintOptionsOrMessage } from '../shared-types';

/**
 * Creates the class instance shape.
 *
 * @template F The instance constructor.
 */
export function instance<F extends new (...args: any[]) => any>(
  ctor: F,
  options?: InputConstraintOptionsOrMessage
): InstanceShape<F> {
  return new InstanceShape(ctor, options);
}
