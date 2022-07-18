import { Type } from './Type';
import { ParserContext } from '../ParserContext';
import { createIssue, getValueType, IssueCode, ValueType } from '../utils';

export class BooleanType extends Type<boolean> {
  _parse(value: any, context: ParserContext): any {
    if (getValueType(value) !== ValueType.BOOLEAN) {
      context.raiseIssue(createIssue(context, IssueCode.INVALID_TYPE, value, ValueType.BOOLEAN));
    }
    return value;
  }
}
