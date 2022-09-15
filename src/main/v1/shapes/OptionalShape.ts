import { AnyShape, Shape } from './Shape';
import { ParserOptions } from '../shared-types';
import { applyConstraints, raiseOnError } from '../utils';

export class OptionalShape<S extends AnyShape> extends Shape<S['input'] | undefined, S['output'] | undefined> {
  constructor(protected shape: S, protected defaultValue?: S['output']) {
    super(shape.async);
  }

  at(propertyName: unknown): AnyShape | null {
    const shape = this.shape.at(propertyName);
    return shape === null ? null : new OptionalShape(shape);
  }

  parse(input: unknown, options?: ParserOptions): S['output'] | undefined {
    const output = input === undefined ? this.defaultValue : this.shape.parse(input, options);

    const { constraints } = this;
    if (constraints !== null) {
      raiseOnError(applyConstraints(output, constraints, options, null));
    }
    return output;
  }

  parseAsync(input: unknown, options?: ParserOptions): Promise<S['output'] | undefined> {
    if (!this.async) {
      return super.parseAsync(input, options);
    }

    const outputPromise =
      input === undefined ? Promise.resolve(this.defaultValue) : this.shape.parseAsync(input, options);

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
