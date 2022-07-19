import { Primitive } from '../shared-types';
import { Type } from './Type';
import { ParserContext } from '../ParserContext';
import { createIssue } from '../utils';

export class LiteralType<T extends Primitive> extends Type<T> {
  constructor(private _value: T) {
    super();
  }

  _parse(value: unknown, context: ParserContext): any {
    const { _value } = this;

    if (!Object.is(value, _value)) {
      context.raiseIssue(createIssue(context, 'literal', value, _value));
    }
    return value;
  }
}
