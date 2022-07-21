import { Constructor, InstanceOfType } from '../types';

/**
 * Creates the class instance type definition.
 *
 * @template C The type of the instance constructor.
 */
export function instanceOf<C extends Constructor>(constructor: C): InstanceOfType<C> {
  return new InstanceOfType(constructor);
}
