import '../plugin/number-essentials.js';
import { NumberShape } from '../shape/NumberShape.js';
import { IssueOptions, Message } from '../types.js';
import { number } from './number.js';

const defaultShape = number().int();

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
  return options === undefined ? defaultShape : number(options).int(options);
}
