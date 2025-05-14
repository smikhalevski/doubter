import { MapShape } from '../shape/MapShape.js';
import { AnyShape } from '../shape/Shape.js';
import { IssueOptions, Message } from '../types.js';

/**
 * Creates the {@link !Map} instance shape.
 *
 * @param keyShape The key shape.
 * @param valueShape The value shape.
 * @param options The issue options or the issue message.
 * @template KeyShape The key shape.
 * @template ValueShape The value shape.
 * @group DSL
 */
export function map<KeyShape extends AnyShape, ValueShape extends AnyShape>(
  keyShape: KeyShape,
  valueShape: ValueShape,
  options?: IssueOptions | Message
): MapShape<KeyShape, ValueShape> {
  return new MapShape(keyShape, valueShape, options);
}
