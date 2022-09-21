import { AnyShape, Shape } from './Shape';
import { ParserOptions } from '../shared-types';
import { parseAsync, raiseIfIssues } from '../utils';

export class LazyShape<S extends AnyShape> extends Shape<S['input'], S['output']> {
  protected shape: S | undefined;

  constructor(async: boolean, protected provider: () => S) {
    super(async);
  }

  at(key: unknown): AnyShape | null {
    return (this.shape ||= this.provider()).at(key);
  }

  parse(input: unknown, options?: ParserOptions): S['output'] {
    const shape = (this.shape ||= this.provider());
    const output = shape.parse(input, options);

    const { applyConstraints } = this;
    if (applyConstraints !== null) {
      raiseIfIssues(applyConstraints(input, options, null));
    }
    return output;
  }

  parseAsync(input: unknown, options?: ParserOptions): Promise<S['output']> {
    if (!this.async) {
      return parseAsync(this, input, options);
    }

    const shape = (this.shape ||= this.provider());
    const promise = shape.parseAsync(input, options);

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
