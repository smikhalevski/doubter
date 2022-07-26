import { ConstraintOptions, ParserOptions, Primitive } from '../shared-types';
import { Type } from './Type';
import { raiseIssue } from '../utils';

/**
 * The type definition that constrains input to one of the primitive values.
 *
 * @template T The type of the allowed values.
 */
export class OneOfType<T extends Primitive> extends Type<T> {
  /**
   * Creates a new {@link OneOfType} instance.
   *
   * @param values The list of values allowed for the input.
   * @param options
   */
  constructor(protected values: T[], options?: ConstraintOptions) {
    super(options);
  }

  parse(input: any, options?: ParserOptions): T {
    const { values } = this;

    if (!values.includes(input)) {
      raiseIssue(input, 'oneOf', values, this.options, 'Must be equal to one of: ' + values.join(', '));
    }
    return input;
  }
}
