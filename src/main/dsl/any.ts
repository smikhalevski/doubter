import { AnyShape, Shape } from '../shape/Shape.ts';
import { Message, ParseOptions, RefineOptions } from '../types.ts';

/**
 * Creates the unconstrained shape.
 *
 * You can specify compile-time type to enhance type inference.
 *
 * This provides _no runtime type-safety_!
 *
 * @template Value The input and the output value.
 * @group DSL
 */
export function any<Value = any>(): Shape<Value>;

/**
 * Creates the shape that is constrained with a
 * [narrowing predicate](https://www.typescriptlang.org/docs/handbook/2/narrowing.html).
 *
 * @param cb The type predicate that returns `true` if value conforms the required type, or `false` otherwise.
 * @param options The issue options or the issue message.
 * @returns The shape that has the narrowed output.
 * @template Value The input and the output value.
 * @group DSL
 */
export function any<Value>(
  /**
   * @param value The input value.
   * @param options Parsing options.
   */
  cb: (value: any, options: ParseOptions) => value is Value,
  options?: RefineOptions | Message
): Shape<Value>;

/**
 * Creates the shape that is constrained with a predicate.
 *
 * @param cb The predicate that returns truthy result if value is valid, or returns falsy result otherwise.
 * @param options The issue options or the issue message.
 * @template Value The input and the output value.
 * @group DSL
 */
export function any<Value = any>(
  /**
   * @param value The input value.
   * @param options Parsing options.
   */
  cb: (value: any, options: ParseOptions) => boolean,
  options?: RefineOptions | Message
): Shape<Value>;

export function any(cb?: (value: any, options: ParseOptions) => boolean, options?: RefineOptions | Message): AnyShape {
  const shape = new Shape();

  return cb === null || cb === undefined ? shape : shape.refine(cb, options);
}
