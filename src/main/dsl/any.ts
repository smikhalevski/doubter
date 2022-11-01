import { AnyShape, Shape } from '../shapes';
import { Message, NarrowingOptions } from '../shared-types';

/**
 * Creates the unconstrained shape. You can specify compile-time type to enhance type inference.
 *
 * @template T The input and output.
 */
export function any<T = any>(): Shape<T>;

/**
 * Creates a shape that is constrained with a [narrowing predicate](https://www.typescriptlang.org/docs/handbook/2/narrowing.html).
 *
 * @param predicate The type predicate that returns `true` if value conforms the required type, or `false` otherwise.
 * @param options The constraint options or an issue message.
 * @returns The shape that has the narrowed output.
 * @template I The input value.
 * @template O The output value.
 */
export function any<I, O>(predicate: (value: any) => value is O, options?: NarrowingOptions | Message): Shape<I, O>;

/**
 * Creates a shape that is constrained with a predicate.
 *
 * @param predicate The predicate that returns truthy result if value is valid, or returns falsy result otherwise.
 * @param options The constraint options or an issue message.
 * @template I The input value.
 * @template O The output value.
 */
export function any<I = any, O = I>(
  predicate: (value: any) => boolean,
  options?: NarrowingOptions | Message
): Shape<I, O>;

export function any(predicate?: (value: unknown) => boolean, options?: NarrowingOptions | Message): AnyShape {
  const shape = new Shape(false);

  return predicate != null ? shape.narrow(predicate, options) : shape;
}
