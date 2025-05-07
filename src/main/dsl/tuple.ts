import { ArrayShape } from '../shape/ArrayShape.ts';
import { AnyShape, Shape } from '../shape/Shape.ts';
import { IssueOptions, Message } from '../types.ts';

/**
 * Creates the tuple shape.
 *
 * @param shapes The array of tuple element shapes.
 * @param options The issue options or the issue message.
 * @template HeadShapes The head tuple elements.
 * @group DSL
 */
export function tuple<HeadShapes extends readonly [AnyShape, ...AnyShape[]]>(
  shapes: HeadShapes,
  options?: IssueOptions | Message
): ArrayShape<HeadShapes, null>;

/**
 * Creates the tuple shape with rest elements.
 *
 * @param headShapes The array of tuple element shapes.
 * @param restShape The shape of rest elements.
 * @param options The issue options or the issue message.
 * @template HeadShapes The head tuple elements.
 * @template RestShape The rest tuple elements.
 * @group DSL
 */
export function tuple<HeadShapes extends readonly [AnyShape, ...AnyShape[]], RestShape extends AnyShape | null>(
  headShapes: HeadShapes,
  restShape: RestShape,
  options?: IssueOptions | Message
): ArrayShape<HeadShapes, RestShape>;

export function tuple(
  shapes: [AnyShape, ...AnyShape[]],
  restShape?: AnyShape | IssueOptions | Message | null,
  options?: IssueOptions | Message
): ArrayShape<[AnyShape, ...AnyShape[]], AnyShape | null> {
  if (restShape === null || restShape === undefined || restShape instanceof Shape) {
    return new ArrayShape(shapes, restShape || null, options);
  } else {
    return new ArrayShape(shapes, null, restShape);
  }
}
