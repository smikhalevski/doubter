import { Primitive } from '../shared-types';
import { Type } from './Type';
import { ParserContext } from '../ParserContext';
import { NotOneOfIssue } from '../issue-utils';
import { IssueCode } from '../utils';

export class OneOfType<T extends Primitive> extends Type<T> {
  constructor(private _values: T[]) {
    super();
  }

  _parse(value: any, context: ParserContext): any {
    const { _values } = this;

    if (!_values.includes(value)) {
      context.raiseIssue<NotOneOfIssue>({
        code: IssueCode.NOT_ONE_OF,
        path: context.getPath(),
        value,
        values: _values,
      });
    }
    return value;
  }
}
