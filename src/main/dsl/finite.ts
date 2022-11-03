import { NumberShape } from '../shapes';
import { Message, TypeConstraintOptions } from '../shared-types';

/**
 * Creates the finite number shape.
 */
export function finite(options?: TypeConstraintOptions | Message): NumberShape {
  return new NumberShape(options).refine(Number.isFinite, options);
}

export { finite as double };
