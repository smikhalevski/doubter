import { BooleanShape } from '../shape/BooleanShape.js';
import { IssueOptions, Message } from '../types.js';

const defaultShape = new BooleanShape();

/**
 * Creates the boolean shape.
 *
 * @param options The issue options or the issue message.
 * @group DSL
 */
export function boolean(options?: IssueOptions | Message): BooleanShape {
  return options === undefined ? defaultShape : new BooleanShape(options);
}
