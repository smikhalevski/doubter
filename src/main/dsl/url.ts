import { StringShape } from '../shape/StringShape.js';
import { IssueOptions, Message } from '../types.js';
import { string } from './string.js';

/**
 * Creates the string shape that requires input to be parsable as a {@link URL}.
 *
 * Shortcut for:
 * ```
 * d.string(options).url(options)
 * ```
 *
 * @param options The issue options or the issue message.
 * @group DSL
 */
export function url(options?: IssueOptions | Message): StringShape {
  return string().url(options);
}
