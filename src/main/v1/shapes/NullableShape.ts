import { AnyShape, Shape } from './Shape';
import { OptionalShape } from './OptionalShape';
import { ParserOptions } from '../shared-types';
import { applyConstraints, raiseOnError } from '../utils';

export class NullableShape<X extends AnyShape> extends Shape<X['input'] | null, X['output'] | null> {
  constructor(protected shape: X) {
    super(shape.async);
  }

  at(key: unknown): AnyShape | null {
    const childShape = this.shape.at(key);
    return childShape === null ? null : new OptionalShape(childShape);
  }

  parse(input: unknown, options?: ParserOptions): X['output'] | undefined {
    const output = input === null ? null : this.shape.parse(input, options);

    const { constraints } = this;
    if (constraints !== null) {
      raiseOnError(applyConstraints(output, constraints, options, null));
    }
    return output;
  }

  parseAsync(input: unknown, options?: ParserOptions): Promise<X['output'] | undefined> {
    if (!this.async) {
      return super.parseAsync(input, options);
    }

    const outputPromise = input === null ? Promise.resolve(null) : this.shape.parseAsync(input, options);

    const { constraints } = this;
    if (constraints !== null) {
      return outputPromise.then(output => {
        raiseOnError(applyConstraints(output, constraints, options, null));
        return output;
      });
    }
    return outputPromise;
  }
}
