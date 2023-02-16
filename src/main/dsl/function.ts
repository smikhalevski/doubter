import { AnyShape, ArrayShape, FunctionShape, Shape } from '../shapes';
import { ConstraintOptions, Message } from '../shared-types';

export function function_(options?: ConstraintOptions | Message): FunctionShape<Shape<[]>, null, null>;

export function function_<A extends readonly [AnyShape, ...AnyShape[]] | []>(
  argShapes: A,
  options?: ConstraintOptions | Message
): FunctionShape<ArrayShape<A, null>, null, null>;

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
