import { NumberShape } from '../shape/NumberShape.js';
import { IssueOptions, Message } from '../types.js';

/**
 * Creates the integer number shape.
 *
 * Shortcut for:
 * ```
 * d.number().int()
 * ```
 *
 * @param options The issue options or the issue message.
 * @group DSL
 */
export function int(options?: IssueOptions | Message): NumberShape {
  return new NumberShape(options).int(options);
}
