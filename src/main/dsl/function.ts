import { AnyShape, ArrayShape, FunctionShape, Shape } from '../shapes';
import { ConstraintOptions, Message } from '../shared-types';

/**
 * Creates a shape of a function that has no arguments.
 *
 * @param options The constraint options or an issue message.
 */
export function function_(options?: ConstraintOptions | Message): FunctionShape<Shape<[]>, null, null>;

/**
 * Creates a shape of a function with arguments parsed by corresponding shapes in the `argShapes` array.
 *
 * @param argShapes The array of argument shapes.
 * @param options The constraint options or an issue message.
 * @template A The array of argument shapes.
 */
export function function_<A extends readonly [AnyShape, ...AnyShape[]] | []>(
  argShapes: A,
  options?: ConstraintOptions | Message
): FunctionShape<ArrayShape<A, null>, null, null>;

/**
 * Creates a shape of a function with arguments parsed by an array shape.
 *
 * @param argsShape The shape of the array of arguments.
 * @param options The constraint options or an issue message.
 * @template A The shape of the array of arguments.
 */
export function function_<I extends readonly any[], O extends readonly any[], A extends Shape<I, O>>(
  argsShape: A,
  options?: ConstraintOptions | Message
): FunctionShape<A, null, null>;

export function function_(
  argShapes?: Shape | AnyShape[] | ConstraintOptions | Message,
  options?: ConstraintOptions | Message
) {
  if (Array.isArray(argShapes)) {
    argShapes = new ArrayShape(argShapes, null);
  }
  if (!(argShapes instanceof Shape)) {
    options = argShapes;
    argShapes = new Shape();
  }
  return new FunctionShape(argShapes, null, null, options);
}

// noinspection ReservedWordAsName
export { function_ as function, function_ as fn };
