import { JSONShape } from '../shapes';
import { ConstraintOptions, Message } from '../types';

/**
 * Creates the shape that parses JSON strings.
 *
 * @param options The constraint options or an issue message.
 */
export function json(options?: ConstraintOptions | Message): JSONShape {
  return new JSONShape(options);
}
