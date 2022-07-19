import { createIssue } from '../utils';
import { NumberType } from './NumberType';
import { ParserContext } from '../ParserContext';

export class IntegerType extends NumberType {
  _parse(value: unknown, context: ParserContext): any {
    if (!Number.isInteger(value)) {
      context.raiseIssue(createIssue(context, 'type', value, 'integer'));
      return value;
    }
    return super._parse(value, context);
  }
}
