import { Type } from './Type';
import { ParserContext } from '../ParserContext';
import { getValueType, ValueType } from '../utils';
import { createInvalidTypeIssue } from '../issue-utils';

export class BooleanType extends Type<boolean> {
  _parse(value: any, context: ParserContext): any {
    const receivedType = getValueType(value);

    if (receivedType !== ValueType.BOOLEAN) {
      context.raiseIssue(createInvalidTypeIssue(context, value, ValueType.BOOLEAN, receivedType));
    }
    return value;
  }
}
