import { SymbolShape } from '../shape/SymbolShape.js';
import { IssueOptions, Message } from '../types.js';

const defaultShape = new SymbolShape();

/**
 * Creates the symbol shape.
 *
 * @param options The issue options or the issue message.
 * @group DSL
 */
export function symbol(options?: IssueOptions | Message): SymbolShape {
  return options === undefined ? defaultShape : new SymbolShape(options);
}
