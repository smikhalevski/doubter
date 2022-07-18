import { Primitive } from '../shared-types';
import { Type } from './Type';
import { ParserContext } from '../ParserContext';
import { createIssue, IssueCode } from '../utils';

export class OneOfType<T extends Primitive> extends Type<T> {
  constructor(private _values: T[]) {
    super();
  }

  _parse(value: any, context: ParserContext): any {
    const { _values } = this;

    if (!_values.includes(value)) {
      context.raiseIssue(createIssue(context, IssueCode.NOT_ONE_OF, value, _values));
    }
    return value;
  }
}
