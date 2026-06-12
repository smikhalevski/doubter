import { NumberShape } from '../shape/NumberShape.js';
import { IssueOptions, Message } from '../types.js';

/**
 * Creates the unsigned integer number shape.
 *
 * Shortcut for:
 * ```
 * d.number().int().nonNegative()
 * ```
 *
 * @param options The issue options or the issue message.
 * @group DSL
 */
export function uint(options?: IssueOptions | Message): NumberShape {
  return new NumberShape(options).int(options).nonNegative(options);
}
