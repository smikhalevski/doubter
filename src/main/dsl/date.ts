import { DateShape } from '../shapes';
import { ConstraintOptions, Message } from '../types';

/**
 * Creates the `Date` shape.
 *
 * @param options The constraint options or an issue message.
 */
export function date(options?: ConstraintOptions | Message): DateShape {
  return new DateShape(options);
}
