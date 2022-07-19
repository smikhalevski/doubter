import { Type } from './Type';
import { ParserContext } from '../ParserContext';
import { createIssue } from '../utils';

export class BigIntType extends Type<bigint> {
  _parse(value: unknown, context: ParserContext): any {
    if (typeof value !== 'bigint') {
      context.raiseIssue(createIssue(context, 'type', value, 'bigint'));
    }
    return value;
  }
}
