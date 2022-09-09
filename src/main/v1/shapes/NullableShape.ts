import { AnyShape, Shape } from './Shape';
import { OptionalShape } from './OptionalShape';
import { ParserOptions } from '../shared-types';

export class NullableShape<X extends AnyShape> extends Shape<X['input'] | null, X['output'] | null> {
  constructor(protected shape: X) {
    super(shape.async);
  }

  at(key: unknown): AnyShape | null {
    const childShape = this.shape.at(key);
    return childShape === null ? null : new OptionalShape(childShape);
  }

  parse(input: unknown, options?: ParserOptions): X['output'] | undefined {
    return input === null ? null : this.shape.parse(input, options);
  }

  parseAsync(input: unknown, options?: ParserOptions): Promise<X['output'] | undefined> {
    return input === null ? Promise.resolve(null) : this.shape.parseAsync(input, options);
  }
}
