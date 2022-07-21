import { Primitive } from '../shared-types';
import { Type } from './Type';
import { ParserContext } from '../ParserContext';
import { createIssue } from '../utils';

/**
 * The type definition that constrains input to one of the primitive values.
 *
 * @template T The type of the allowed values.
 */
export class OneOfType<T extends Primitive> extends Type<T> {
  /**
   * Creates a new {@link OneOfType} instance.
   *
   * @param _values The list of values allowed for the input.
   */
  constructor(private _values: T[]) {
    super();
  }

  _parse(input: any, context: ParserContext): any {
    const { _values } = this;

    if (!_values.includes(input)) {
      context.raiseIssue(createIssue(context, 'oneOf', input, _values));
    }
    return input;
  }
}
