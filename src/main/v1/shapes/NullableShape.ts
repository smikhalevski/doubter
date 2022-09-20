import { AnyShape, Shape } from './Shape';
import { OptionalShape } from './OptionalShape';
import { ParserOptions } from '../shared-types';
import { parseAsync, raiseIfIssues } from '../utils';

export class NullableShape<S extends AnyShape> extends Shape<S['input'] | null, S['output'] | null> {
  constructor(protected shape: S) {
    super(shape.async);
  }

  at(key: unknown): AnyShape | null {
    const shape = this.shape.at(key);
    return shape === null ? null : new OptionalShape(shape);
  }

  parse(input: unknown, options?: ParserOptions): S['output'] | undefined {
    const output = input === null ? null : this.shape.parse(input, options);

    const { constraintsProcessor } = this;
    if (constraintsProcessor !== null) {
      raiseIfIssues(constraintsProcessor(output, options, null));
    }
    return output;
  }

  parseAsync(input: unknown, options?: ParserOptions): Promise<S['output'] | undefined> {
    if (!this.async) {
      return parseAsync(this, input, options);
    }

    const promise = input === null ? Promise.resolve(null) : this.shape.parseAsync(input, options);

    const { constraintsProcessor } = this;
    if (constraintsProcessor !== null) {
      return promise.then(output => {
        raiseIfIssues(constraintsProcessor(output, options, null));
        return output;
      });
    }
    return promise;
  }
}
