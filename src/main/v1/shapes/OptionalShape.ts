import { AnyShape, Shape } from './Shape';
import { ParserOptions } from '../shared-types';
import { raiseIfIssues } from '../utils';

export class OptionalShape<S extends AnyShape> extends Shape<S['input'] | undefined, S['output'] | undefined> {
  constructor(protected shape: S, protected defaultValue?: S['output']) {
    super(shape.async);
  }

  at(key: unknown): AnyShape | null {
    const shape = this.shape.at(key);
    return shape === null ? null : new OptionalShape(shape);
  }

  parse(input: unknown, options?: ParserOptions): S['output'] | undefined {
    const output = input === undefined ? this.defaultValue : this.shape.parse(input, options);

    const { applyConstraints } = this;
    if (applyConstraints !== null) {
      raiseIfIssues(applyConstraints(output, options, null));
    }
    return output;
  }

  parseAsync(input: unknown, options?: ParserOptions): Promise<S['output'] | undefined> {
    if (!this.async) {
      return super.parseAsync(input, options);
    }

    const promise = input === undefined ? Promise.resolve(this.defaultValue) : this.shape.parseAsync(input, options);

    const { applyConstraints } = this;
    if (applyConstraints !== null) {
      return promise.then(output => {
        raiseIfIssues(applyConstraints(output, options, null));
        return output;
      });
    }
    return promise;
  }
}
