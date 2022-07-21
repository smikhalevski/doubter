import { Primitive } from '../shared-types';
import { Type } from './Type';
import { ParserContext } from '../ParserContext';
import { createIssue } from '../utils';

/**
 * The literal value type definition.
 *
 * @template T The literal value.
 */
export class LiteralType<T extends Primitive> extends Type<T> {
  /**
   * Creates a new {@link LiteralType} instance.
   *
   * @param _value The literal value that is compared with the input value.
   */
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
