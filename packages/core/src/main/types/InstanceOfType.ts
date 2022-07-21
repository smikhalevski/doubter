import { Type } from './Type';
import { ParserContext } from '../ParserContext';
import { createIssue } from '../utils';

/**
 * The type of the arbitrary constructor.
 */
export type Constructor = new (...args: any[]) => any;

/**
 * The class instance type definition.
 *
 * @template C The class instance constructor.
 */
export class InstanceOfType<C extends Constructor> extends Type<C> {
  constructor(private _constructor: Constructor) {
    super();
  }

  _parse(input: unknown, context: ParserContext): any {
    if (!(input instanceof this._constructor)) {
      context.raiseIssue(createIssue(context, 'instanceOf', input, this._constructor));
    }
    return input;
  }
}
