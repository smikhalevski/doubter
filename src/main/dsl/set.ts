import { SetShape } from '../shape/SetShape';
import { AnyShape } from '../shape/Shape';
import { IssueOptions, Message } from '../types';

/**
 * Creates the {@link !Set Set} instance shape.
 *
 * @param shape The value shape
 * @param options The issue options or the issue message.
 * @template ValueShape The value shape.
 * @group DSL
 */
export function set<ValueShape extends AnyShape>(
  shape: ValueShape,
  options?: IssueOptions | Message
): SetShape<ValueShape> {
  return new SetShape(shape, options);
}
