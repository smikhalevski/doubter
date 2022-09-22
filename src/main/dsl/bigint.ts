import { BigIntShape } from '../shapes';
import { InputConstraintOptionsOrMessage } from '../shared-types';

/**
 * Creates the bigint shape.
 */
export function bigint(options?: InputConstraintOptionsOrMessage): BigIntShape {
  return new BigIntShape(options);
}
