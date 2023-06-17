import { AnyShape, ArrayShape, Shape } from '../shape';
import { ConstraintOptions, Message } from '../types';

/**
 * Creates the tuple shape.
 *
 * @param shapes The array of tuple element shapes.
 * @param options The constraint options or an issue message.
 * @template HeadShapes The head tuple elements.
 */
export function tuple<HeadShapes extends readonly [AnyShape, ...AnyShape[]]>(
  shapes: HeadShapes,
  options?: ConstraintOptions | Message
): ArrayShape<HeadShapes, null>;

/**
 * Creates the tuple shape with rest elements.
 *
 * @param shapes The array of tuple element shapes.
 * @param restShape The shape of rest elements.
 * @param options The constraint options or an issue message.
 * @template HeadShapes The head tuple elements.
 * @template RestShape The rest tuple elements.
 */
export function tuple<HeadShapes extends readonly [AnyShape, ...AnyShape[]], RestShape extends AnyShape | null>(
  shapes: HeadShapes,
  restShape: RestShape,
  options?: ConstraintOptions | Message
): ArrayShape<HeadShapes, RestShape>;

export function tuple(
  shapes: [AnyShape, ...AnyShape[]],
  restShape?: AnyShape | ConstraintOptions | Message | null,
  options?: ConstraintOptions | Message
): ArrayShape<[AnyShape, ...AnyShape[]], AnyShape | null> {
  if (restShape === null || restShape === undefined || restShape instanceof Shape) {
    return new ArrayShape(shapes, restShape || null, options);
  } else {
    return new ArrayShape(shapes, null, restShape);
  }
}
