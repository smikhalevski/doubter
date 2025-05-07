import { InstanceShape } from '../shape/InstanceShape.ts';
import { IssueOptions, Message } from '../types.ts';

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
  return new InstanceShape(ctor, options);
}
