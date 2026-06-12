import { InstanceShape } from '../shape/InstanceShape.js';
import { IssueOptions, Message } from '../types.js';

const defaultShapeCache = new WeakMap<Function, InstanceShape<any>>();

/**
 * Creates the class instance shape.
 *
 * @param ctor The instance constructor.
 * @param options The issue options or the issue message.
 * @template Ctor The instance constructor.
 * @group DSL
 */
export function instanceOf<Ctor extends new (...args: any[]) => any>(
  ctor: Ctor,
  options?: IssueOptions | Message
): InstanceShape<Ctor> {
  if (options !== undefined) {
    return new InstanceShape(ctor, options);
  }

  let defaultShape = defaultShapeCache.get(ctor);

  if (defaultShape !== undefined) {
    return defaultShape;
  }

  defaultShape = new InstanceShape(ctor);

  defaultShapeCache.set(ctor, defaultShape);

  return defaultShape;
}
