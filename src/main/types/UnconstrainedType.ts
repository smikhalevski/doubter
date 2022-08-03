import { Type } from './Type';
import { ParserOptions } from '../shared-types';

/**
 * The unconstrained type definition.
 *
 * @template The type of the unconstrained value.
 */
export class UnconstrainedType<T = any> extends Type<T> {
  constructor() {
    super(false);
  }

  parse(input: any, options?: ParserOptions): T {
    return input;
  }
}
