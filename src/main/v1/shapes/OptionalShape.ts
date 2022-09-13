import { AnyShape, Shape } from './Shape';
import { ParserOptions } from '../shared-types';

export class OptionalShape<S extends AnyShape> extends Shape<S['input'] | undefined, S['output'] | undefined> {
  constructor(protected shape: S, protected defaultValue?: S['output']) {
    super(shape.async);
  }

  at(key: unknown): AnyShape | null {
    const shape = this.shape.at(key);

    return shape === null ? null : new OptionalShape(shape);
  }

  parse(input: unknown, options?: ParserOptions): S['output'] | undefined {
    return input === undefined ? this.defaultValue : this.shape.parse(input, options);
  }

  parseAsync(input: unknown, options?: ParserOptions): Promise<S['output'] | undefined> {
    return input === undefined ? Promise.resolve(this.defaultValue) : this.shape.parseAsync(input, options);
  }
}
