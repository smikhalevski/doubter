import { createIssue } from '../utils';
import { NumberType } from './NumberType';
import { ParserContext } from '../ParserContext';

export class IntegerType extends NumberType {
  _parse(input: unknown, context: ParserContext): any {
    if (!Number.isInteger(input)) {
      context.raiseIssue(createIssue(context, 'type', input, 'integer'));
      return input;
    }
    return super._parse(input, context);
  }
}
