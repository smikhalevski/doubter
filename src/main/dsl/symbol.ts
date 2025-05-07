import { SymbolShape } from '../shape/SymbolShape.ts';
import { IssueOptions, Message } from '../types.ts';

/**
 * Creates the symbol shape.
 *
 * @param options The issue options or the issue message.
 * @group DSL
 */
export function symbol(options?: IssueOptions | Message): SymbolShape {
  return new SymbolShape(options);
}
