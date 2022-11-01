import { NumberShape } from '../shapes';
import { Message, TypeCheckOptions } from '../shared-types';

/**
 * Creates the number shape.
 */
export function number(options?: TypeCheckOptions | Message): NumberShape {
  return new NumberShape(options);
}
