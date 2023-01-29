import { SymbolShape } from '../shapes';
import { ConstraintOptions, Message } from '../shared-types';

/**
 * Creates the symbol shape.
 *
 * @param options The constraint options or an issue message.
 */
export function symbol(options?: ConstraintOptions | Message): SymbolShape {
  return new SymbolShape(options);
}
