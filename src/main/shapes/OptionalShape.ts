import { AnyShape, Shape } from './Shape';
import { ParserOptions } from './shared-types';

export class OptionalShape<X extends AnyShape> extends Shape<X['input'] | undefined, X['output'] | undefined> {
  constructor(protected shape: X, protected defaultValue?: X['output']) {
    super(shape.async);
  }

  at(key: unknown): AnyShape | null {
    const childShape = this.shape.at(key);
    return childShape === null ? null : new OptionalShape(childShape);
  }

  parse(input: unknown, options?: ParserOptions): X['output'] | undefined {
    return input === undefined ? this.defaultValue : this.shape.parse(input, options);
  }

  parseAsync(input: unknown, options?: ParserOptions): Promise<X['output'] | undefined> {
    return input === undefined ? Promise.resolve(this.defaultValue) : this.shape.parseAsync(input, options);
  }
}
