import { Type } from './Type';
import { ParserContext } from '../ParserContext';
import { createIssue } from '../utils';

export type Constructor = new (...args: any[]) => any;

export class InstanceOfType<C extends Constructor> extends Type<C> {
  constructor(private _constructor: Constructor) {
    super();
  }

  _parse(value: unknown, context: ParserContext): any {
    if (value instanceof this._constructor) {
      context.raiseIssue(createIssue(context, 'instance_of', value, this._constructor));
    }
    return value;
  }
}
