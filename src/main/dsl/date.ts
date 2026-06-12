import { DateShape } from '../shape/DateShape.js';
import { IssueOptions, Message } from '../types.js';

const defaultShape = new DateShape();

/**
 * Creates the {@link Date} shape.
 *
 * @param options The issue options or the issue message.
 * @group DSL
 */
export function date(options?: IssueOptions | Message): DateShape {
  return options === undefined ? defaultShape : new DateShape(options);
}
