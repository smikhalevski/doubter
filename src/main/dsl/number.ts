import { NumberType } from '../types';
import { ConstraintOptions } from '../shared-types';

/**
 * Creates the number type definition.
 */
export function number(options?: ConstraintOptions): NumberType {
  return new NumberType(options);
}
