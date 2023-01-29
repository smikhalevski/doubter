import { AnyShape, Shape } from '../shapes';
import { ConstraintOptions, Message } from '../shared-types';

/**
 * Creates the unconstrained shape.
 *
 * You can specify compile-time type to enhance type inference.
 *
 * @template T The input and output.
 */
export function any<T = any>(): Shape<T>;

/**
 * Creates a shape that is constrained with a
 * [narrowing predicate](https://www.typescriptlang.org/docs/handbook/2/narrowing.html).
 *
 * @param cb The type predicate that returns `true` if value conforms the required type, or `false` otherwise.
 * @param options The constraint options or an issue message.
 * @returns The shape that has the narrowed output.
 * @template T The input and output.
 */
export function any<T>(cb: (value: any) => value is T, options?: ConstraintOptions | Message): Shape<T>;

/**
 * Creates a shape that is constrained with a predicate.
 *
 * @param cb The predicate that returns truthy result if value is valid, or returns falsy result otherwise.
 * @param options The constraint options or an issue message.
 * @template T The input and output.
 */
export function any<T = any>(cb: (value: any) => boolean, options?: ConstraintOptions | Message): Shape<T>;

export function any(cb?: (value: any) => boolean, options?: ConstraintOptions | Message): AnyShape {
  const shape = new Shape();

  return cb !== undefined ? shape.refine(cb, options) : shape;
}
