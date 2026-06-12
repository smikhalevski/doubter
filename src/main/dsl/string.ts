import { StringShape } from '../shape/StringShape.js';
import { IssueOptions, Message } from '../types.js';

const defaultShape = new StringShape();

/**
 * Creates the string shape.
 *
 * @param options The issue options or the issue message.
 * @group DSL
 */
export function string(options?: IssueOptions | Message): StringShape {
  return options === undefined ? defaultShape : new StringShape(options);
}
