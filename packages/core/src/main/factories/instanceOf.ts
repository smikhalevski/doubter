import { Constructor, InstanceOfType } from '../types';

export function instanceOf<C extends Constructor>(constructor: C): InstanceOfType<C> {
  return new InstanceOfType(constructor);
}
