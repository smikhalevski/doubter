import { AnyShape, Shape } from './Shape';
import { ParserOptions } from '../shared-types';
import { applyConstraints, raiseOnError } from '../utils';

export class LazyShape<S extends AnyShape> extends Shape<S['input'], S['output']> {
  protected shape: S | undefined;

  constructor(async: boolean, protected provider: () => S) {
    super(async);
  }

  at(propertyName: unknown): AnyShape | null {
    return (this.shape ||= this.provider()).at(propertyName);
  }

  parse(input: unknown, options?: ParserOptions): S['output'] {
    const shape = (this.shape ||= this.provider());
    const output = shape.parse(input, options);

    const { constraints } = this;
    if (constraints !== null) {
      raiseOnError(applyConstraints(input, constraints, options, null));
    }
    return output;
  }

  parseAsync(input: unknown, options?: ParserOptions): Promise<S['output']> {
    if (!this.async) {
      return super.parseAsync(input, options);
    }

    const shape = (this.shape ||= this.provider());
    const outputPromise = shape.parseAsync(input, options);

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
