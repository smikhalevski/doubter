import { Primitive } from '../shared-types';
import { Type } from './Type';
import { ParserContext } from '../ParserContext';
import { createIssue } from '../utils';

export class LiteralType<T extends Primitive> extends Type<T> {
  constructor(private _value: T) {
    super();
  }

  _parse(input: unknown, context: ParserContext): any {
    const { _value } = this;

    if (!Object.is(input, _value)) {
      context.raiseIssue(createIssue(context, 'literal', input, _value));
    }
    return input;
  }
}
