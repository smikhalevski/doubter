import { DateShape } from '../shapes';
import { Message, TypeConstraintOptions } from '../shared-types';

/**
 * Creates the `Date` shape.
 *
 * @param options The constraint options or an issue message.
 */
export function date(options?: TypeConstraintOptions | Message): DateShape {
  return new DateShape(options);
}
