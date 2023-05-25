import { AnyShape, MapShape } from '../shapes';
import { ConstraintOptions, Message } from '../types';

/**
 * Creates the `Map` instance shape.
 *
 * @param keyShape The key shape.
 * @param valueShape The value shape.
 * @param options The type constraint options or an issue message.
 * @template KeyShape The key shape.
 * @template ValueShape The value shape.
 */
export function map<KeyShape extends AnyShape, ValueShape extends AnyShape>(
  keyShape: KeyShape,
  valueShape: ValueShape,
  options?: ConstraintOptions | Message
): MapShape<KeyShape, ValueShape> {
  return new MapShape(keyShape, valueShape, options);
}
