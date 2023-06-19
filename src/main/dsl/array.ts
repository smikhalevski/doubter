import { AnyShape, ArrayShape, Shape } from '../shape';
import { ConstraintOptions, Message } from '../types';

/**
 * Creates the unconstrained array shape.
 *
 * @param options The constraint options or an issue message.
 * @group DSL
 */
export function array(options?: ConstraintOptions | Message): ArrayShape<[], Shape>;

/**
 * Creates the array shape with elements that conform the element shape.
 *
 * @param shape The shape of array elements.
 * @param options The constraint options or an issue message.
 * @template ValueShape The shape of array elements.
 * @group DSL
 */
export function array<ValueShape extends AnyShape>(
  shape: ValueShape,
  options?: ConstraintOptions | Message
): ArrayShape<[], ValueShape>;

export function array(
  shape?: AnyShape | ConstraintOptions | Message,
  options?: ConstraintOptions | Message
): ArrayShape<[], AnyShape> {
  if (shape instanceof Shape) {
    return new ArrayShape([], shape, options);
  } else {
    return new ArrayShape([], new Shape(), shape);
  }
}
