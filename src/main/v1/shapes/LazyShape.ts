import { AnyShape, Shape } from './Shape';
import { ParserOptions } from '../shared-types';

export class LazyShape<X extends AnyShape> extends Shape<X['input'], X['output']> {
  protected shape: X | undefined;

  constructor(async: boolean, protected provider: () => X) {
    super(async);
  }

  at(key: unknown): AnyShape | null {
    return (this.shape ||= this.provider()).at(key);
  }

  parse(input: unknown, options?: ParserOptions): X['output'] {
    return (this.shape ||= this.provider()).parse(input, options);
  }

  parseAsync(input: unknown, options?: ParserOptions): Promise<X['output']> {
    return (this.shape ||= this.provider()).parseAsync(input, options);
  }
}
