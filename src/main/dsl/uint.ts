import { NumberShape } from '../shape/NumberShape.js';
import { IssueOptions, Message } from '../types.js';
import { int } from './int.js';

const defaultShape = int().nonNegative();

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
  return options === undefined ? defaultShape : int(options).nonNegative(options);
}
