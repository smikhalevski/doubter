import { JSONShape } from '../shapes';
import { Message, TypeConstraintOptions } from '../shared-types';

/**
 * Creates the shape that parses JSON strings.
 *
 * @param options The constraint options or an issue message.
 */
export function json(options?: TypeConstraintOptions | Message): JSONShape {
  return new JSONShape(options);
}
