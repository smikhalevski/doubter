import { AnyShape, ArrayShape, Shape } from '../shapes';
import { ConstraintOptions, Message } from '../shared-types';

/**
 * Creates the unconstrained array shape.
 *
 * @param options The constraint options or an issue message.
 */
export function array(options?: ConstraintOptions | Message): ArrayShape<null, null>;

/**
 * Creates the array shape with elements that conform the element shape.
 *
 * @param shape The shape of an array element.
 * @param options The constraint options or an issue message.
 * @template S The shape of array elements.
 */
export function array<S extends AnyShape | null>(shape: S, options?: ConstraintOptions | Message): ArrayShape<null, S>;

export function array(
  shape?: AnyShape | ConstraintOptions | Message,
  options?: ConstraintOptions | Message
): ArrayShape<any, any> {
  if (shape === null || shape === undefined || shape instanceof Shape) {
    return new ArrayShape(null, shape || null, options);
  } else {
    return new ArrayShape(null, null, shape);
  }
}
