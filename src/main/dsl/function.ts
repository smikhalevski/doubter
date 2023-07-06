import { isArray } from '../internal';
import { AnyShape, ArrayShape, FunctionShape, Shape } from '../shape';
import { IssueOptions, Message } from '../types';

/**
 * Creates a shape of a function that has no arguments.
 *
 * @param options The issue options or the issue message.
 * @group DSL
 */
function function_(options?: IssueOptions | Message): FunctionShape<ArrayShape<[], null>, null, null>;

/**
 * Creates a shape of a function with arguments parsed by corresponding shapes in the `argShapes` array.
 *
 * @param argShapes The array of argument shapes.
 * @param options The issue options or the issue message.
 * @template ArgShapes The array of argument shapes.
 * @group DSL
 */
function function_<ArgShapes extends readonly [AnyShape, ...AnyShape[]] | []>(
  argShapes: ArgShapes,
  options?: IssueOptions | Message
): FunctionShape<ArrayShape<ArgShapes, null>, null, null>;

/**
 * Creates a shape of a function with arguments parsed by an array shape.
 *
 * @param argsShape The shape of the array of arguments.
 * @param options The issue options or the issue message.
 * @template InputArgs The array of input arguments.
 * @template OutputArgs The array of input arguments.
 * @template ArgsShape The shape of the array of arguments.
 * @group DSL
 */
function function_<
  InputArgs extends readonly any[],
  OutputArgs extends readonly any[],
  ArgsShape extends Shape<InputArgs, OutputArgs>
>(argsShape: ArgsShape, options?: IssueOptions | Message): FunctionShape<ArgsShape, null, null>;

function function_(argShapes?: Shape | AnyShape[] | IssueOptions | Message, options?: IssueOptions | Message) {
  if (isArray(argShapes)) {
    argShapes = new ArrayShape(argShapes, null);
  }
  if (!(argShapes instanceof Shape)) {
    options = argShapes;
    argShapes = new ArrayShape([], null);
  }
  return new FunctionShape(argShapes as Shape, null, null, options);
}

/**
 * @group DSL
 */
// noinspection ReservedWordAsName
export { function_ as function, function_ as fn };
