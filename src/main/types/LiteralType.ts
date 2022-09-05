import { Awaitable, ConstraintOptions, ParserOptions, Primitive } from '../shared-types';
import { Type } from './Type';
import { isEqual, raiseIssue } from '../utils';

/**
 * The literal value type definition.
 *
 * @template T The literal value.
 */
export class LiteralType<T extends Primitive> extends Type<T> {
  /**
   * Creates a new {@link LiteralType} instance.
   *
   * @param value The literal value that is compared with the input value.
   * @param options The constraint options.
   */
  constructor(protected value: T, options?: ConstraintOptions) {
    super(false, options);
  }

  parse(input: any, options?: ParserOptions): Awaitable<T> {
    const { value } = this;

    if (!isEqual(input, value)) {
      raiseIssue(input, 'literal', value, this.options, 'Must be exactly equal to ' + value);
    }
    return input;
  }
}
