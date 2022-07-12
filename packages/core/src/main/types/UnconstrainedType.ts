import { Type } from './Type';
import { ParserContext } from '../ParserContext';

export class UnconstrainedType<T> extends Type<T> {
  _parse(value: any, context: ParserContext): any {
    return value;
  }
}
