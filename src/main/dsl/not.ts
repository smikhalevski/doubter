import { AnyShape, NotShape, Shape } from '../shape/Shape';
import { IssueOptions, Message } from '../typings';

/**
 * Creates the shape that only allows values that don't conform the shape.
 *
 * @param shape The shape to which the output must not conform.
 * @param options The issue options or the issue message.
 * @template ExcludedShape The shape to which the output must not conform.
 * @group DSL
 */
export function not<ExcludedShape extends AnyShape>(
  shape: ExcludedShape,
  options?: IssueOptions | Message
): NotShape<Shape, ExcludedShape> {
  return new Shape().not(shape, options);
}
