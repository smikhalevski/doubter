import { SymbolShape } from '../shapes';
import { Message, TypeConstraintOptions } from '../shared-types';

/**
 * Creates the symbol shape.
 *
 * @param options The constraint options or an issue message.
 */
export function symbol(options?: TypeConstraintOptions | Message): SymbolShape {
  return new SymbolShape(options);
}
