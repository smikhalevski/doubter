import { Type } from './Type';
import { ParserContext } from '../ParserContext';

export class UnconstrainedType<T> extends Type<T> {
  _parse(input: unknown, context: ParserContext): any {
    return input;
  }
}
