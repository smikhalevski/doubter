import { Type } from './Type';
import { ParserContext } from '../ParserContext';
import { createIssue } from '../utils';

export class BigIntType extends Type<bigint> {
  _parse(input: unknown, context: ParserContext): any {
    if (typeof input !== 'bigint') {
      context.raiseIssue(createIssue(context, 'type', input, 'bigint'));
    }
    return input;
  }
}
