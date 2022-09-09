import { AnyShape, Shape } from './Shape';
import { ParserOptions } from '../shared-types';

export class LazyShape<S extends AnyShape> extends Shape<S['input'], S['output']> {
  protected shape: S | undefined;

  constructor(async: boolean, protected provider: () => S) {
    super(async);
  }

  at(key: unknown): AnyShape | null {
    return (this.shape ||= this.provider()).at(key);
  }

  parse(input: unknown, options?: ParserOptions): S['output'] {
    return (this.shape ||= this.provider()).parse(input, options);
  }

  parseAsync(input: unknown, options?: ParserOptions): Promise<S['output']> {
    return (this.shape ||= this.provider()).parseAsync(input, options);
  }
}
