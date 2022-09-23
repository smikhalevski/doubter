import { Shape } from './Shape';
import { ParserOptions } from '../shared-types';
import { ValidationError } from '../ValidationError';

export class UnconstrainedShape<T = any> extends Shape<T> {
  constructor() {
    super(false);
  }

  safeParse(input: any, options?: ParserOptions): T | ValidationError {
    return input;
  }
}
