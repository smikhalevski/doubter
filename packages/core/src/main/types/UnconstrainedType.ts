import { Type } from './Type';
import { ParserContext } from '../ParserContext';

export class UnconstrainedType<T> extends Type<T> {
  _parse(value: unknown, context: ParserContext): any {
    return value;
  }
}
