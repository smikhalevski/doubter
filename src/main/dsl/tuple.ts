import { AnyShape, ArrayShape, Shape } from '../shapes';
import { Message, TypeConstraintOptions } from '../shared-types';

/**
 * Creates the tuple shape.
 *
 * @param shapes The list of tuple element shapes.
 * @param options The constraint options or an issue message.
 * @template U The tuple elements.
 */
export function tuple<U extends [AnyShape, ...AnyShape[]]>(
  shapes: U,
  options?: TypeConstraintOptions | Message
): ArrayShape<U>;

/**
 * Creates the tuple shape with rest elements.
 *
 * @param shapes The list of tuple element shapes.
 * @param restShape The shape of rest elements.
 * @param options The constraint options or an issue message.
 * @template U The head tuple elements.
 * @template R The rest tuple elements.
 */
export function tuple<U extends [AnyShape, ...AnyShape[]], R extends AnyShape | null = null>(
  shapes: U,
  restShape?: R | null,
  options?: TypeConstraintOptions | Message
): ArrayShape<U, R>;

export function tuple(
  shapes: [AnyShape, ...AnyShape[]],
  restShape?: AnyShape | TypeConstraintOptions | Message | null,
  options?: TypeConstraintOptions | Message
): ArrayShape<[AnyShape, ...AnyShape[]], AnyShape | null> {
  if (restShape == null || restShape instanceof Shape) {
    return new ArrayShape(shapes, restShape, options);
  } else {
    return new ArrayShape(shapes, null, restShape);
  }
}
