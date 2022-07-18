import { Primitive } from '../shared-types';
import { Type } from './Type';
import { ParserContext } from '../ParserContext';
import { createIssue, IssueCode } from '../utils';

export class LiteralType<T extends Primitive> extends Type<T> {
  constructor(private _value: T) {
    super();
  }

  _parse(value: any, context: ParserContext): any {
    const { _value } = this;

    if (!Object.is(value, _value)) {
      context.raiseIssue(createIssue(context, IssueCode.NOT_LITERAL, value, _value));
    }
    return value;
  }
}
