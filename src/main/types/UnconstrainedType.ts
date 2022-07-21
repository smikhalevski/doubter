import { Type } from './Type';
import { ParserContext } from '../ParserContext';

/**
 * The unconstrained type definition.
 */
export class UnconstrainedType<T> extends Type<T> {
  _parse(input: unknown, context: ParserContext): any {
    return input;
  }
}
