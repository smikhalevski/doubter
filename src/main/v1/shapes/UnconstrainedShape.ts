import { Shape } from './Shape';
import { ParserOptions } from '../shared-types';

export class UnconstrainedShape<I = any> extends Shape<I> {
  constructor() {
    super(false);
  }

  parse(input: any, options?: ParserOptions): I {
    return input;
  }
}
