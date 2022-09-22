import { Shape } from './Shape';
import { ParserOptions } from '../shared-types';

export class UnconstrainedShape<T = any> extends Shape<T> {
  constructor() {
    super(false);
  }

  parse(input: any, options?: ParserOptions): T {
    return input;
  }
}
