import { ArrayShape } from '../shape/ArrayShape.js';
import { AnyShape, Shape } from '../shape/Shape.js';
import { IssueOptions, Message } from '../types.js';

/**
 * Creates the unconstrained array shape.
 *
 * @param options The issue options or the issue message.
 * @group DSL
 */
export function array(options?: IssueOptions | Message): ArrayShape<[], Shape>;

/**
 * Creates the array shape with elements that conform the element shape.
 *
 * @param shape The shape of an array element.
 * @param options The issue options or the issue message.
 * @template ValueShape The shape of an array element.
 * @group DSL
 */
export function array<ValueShape extends AnyShape>(
  shape: ValueShape,
  options?: IssueOptions | Message
): ArrayShape<[], ValueShape>;

export function array(
  shape?: AnyShape | IssueOptions | Message,
  options?: IssueOptions | Message
): ArrayShape<[], AnyShape> {
  if (shape instanceof Shape) {
    return new ArrayShape([], shape, options);
  } else {
    return new ArrayShape([], new Shape(), shape);
  }
}
