import { MapShape } from '../shape/MapShape.ts';
import { AnyShape } from '../shape/Shape.ts';
import { IssueOptions, Message } from '../types.ts';

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
