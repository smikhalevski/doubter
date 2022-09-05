import { Type } from './Type';
import { ParserOptions } from '../shared-types';

/**
 * The unconstrained type definition.
 *
 * @template The type of the unconstrained value.
 */
export class UnconstrainedType<I = any> extends Type<I> {
  constructor() {
    super(false);
  }

  parse(input: any, options?: ParserOptions): I {
    return input;
  }
}
