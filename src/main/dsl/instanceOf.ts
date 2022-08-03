import { Constructor, InstanceOfType } from '../types';
import { ConstraintOptions } from '../shared-types';

/**
 * Creates the class instance type definition.
 *
 * @template C The type of the instance constructor.
 */
export function instanceOf<C extends Constructor<any>>(ctor: C, options?: ConstraintOptions): InstanceOfType<C> {
  return new InstanceOfType(ctor, options);
}
