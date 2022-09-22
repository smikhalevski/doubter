import { InstanceShape } from '../shapes';
import { InputConstraintOptions } from '../shared-types';

/**
 * Creates the class instance shape.
 *
 * @template F The instance constructor.
 */
export function instance<F extends new (...args: any[]) => any>(
  ctor: F,
  options?: InputConstraintOptions
): InstanceShape<F> {
  return new InstanceShape(ctor, options);
}
