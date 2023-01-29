import { AnyShape, ArrayShape, Shape } from '../shapes';
import { ConstraintOptions, Message } from '../shared-types';

/**
 * Creates the tuple shape.
 *
 * @param shapes The list of tuple element shapes.
 * @param options The constraint options or an issue message.
 * @template U The tuple elements.
 */
export function tuple<U extends readonly [AnyShape, ...AnyShape[]]>(
  shapes: U,
  options?: ConstraintOptions | Message
): ArrayShape<U, null>;

/**
 * Creates the tuple shape with rest elements.
 *
 * @param shapes The list of tuple element shapes.
 * @param restShape The shape of rest elements.
 * @param options The constraint options or an issue message.
 * @template U The head tuple elements.
 * @template R The rest tuple elements.
 */
export function tuple<U extends readonly [AnyShape, ...AnyShape[]], R extends AnyShape | null>(
  shapes: U,
  restShape: R,
  options?: ConstraintOptions | Message
): ArrayShape<U, R>;

export function tuple(
  shapes: [AnyShape, ...AnyShape[]],
  restShape?: AnyShape | ConstraintOptions | Message | null,
  options?: ConstraintOptions | Message
): ArrayShape<[AnyShape, ...AnyShape[]], AnyShape | null> {
  if (restShape == null || restShape instanceof Shape) {
    return new ArrayShape(shapes, restShape || null, options);
  } else {
    return new ArrayShape(shapes, null, restShape);
  }
}
