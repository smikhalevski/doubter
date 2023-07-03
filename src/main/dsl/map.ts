import { AnyShape, MapShape } from '../shape';
import { IssueOptions, Message } from '../types';

/**
 * Creates the `Map` instance shape.
 *
 * @param keyShape The kind shape.
 * @param valueShape The value shape.
 * @param options The type constraint options or an issue message.
 * @template KeyShape The kind shape.
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
