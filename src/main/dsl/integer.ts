import { NumberShape } from '../shapes';
import { Message, TypeConstraintOptions } from '../shared-types';

/**
 * Creates the integer shape.
 */
export function integer(options?: TypeConstraintOptions | Message): NumberShape {
  return new NumberShape(options).refine(Number.isInteger, options);
}

export { integer as int };
