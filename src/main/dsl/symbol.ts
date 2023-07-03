import { SymbolShape } from '../shape';
import { IssueOptions, Message } from '../types';

/**
 * Creates the symbol shape.
 *
 * @param options The issue options or the issue message.
 * @group DSL
 */
export function symbol(options?: IssueOptions | Message): SymbolShape {
  return new SymbolShape(options);
}
