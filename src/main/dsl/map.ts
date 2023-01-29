import { AnyShape, MapShape } from '../shapes';
import { ConstraintOptions, Message } from '../shared-types';

/**
 * Creates the `Map` instance shape.
 *
 * @param keyShape The key shape.
 * @param valueShape The value shape.
 * @param options The type constraint options or an issue message.
 * @template K The key shape.
 * @template V The value shape.
 */
export function map<K extends AnyShape, V extends AnyShape>(
  keyShape: K,
  valueShape: V,
  options?: ConstraintOptions | Message
): MapShape<K, V> {
  return new MapShape(keyShape, valueShape, options);
}
