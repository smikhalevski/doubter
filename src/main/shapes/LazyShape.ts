import { AnyShape, Shape } from './Shape';
import { ParserOptions } from '../shared-types';
import { parseAsync, returnOrRaiseIssues } from '../utils';

/**
 * The lazily-evaluated shape.
 *
 * @template S The lazily loaded shape.
 */
export class LazyShape<S extends AnyShape> extends Shape<S['input'], S['output']> {
  constructor(async: boolean, private _provider: () => S) {
    super(async);
  }

  private _shape: S | undefined;

  get shape() {
    return (this._shape ||= this._provider());
  }

  at(key: unknown): AnyShape | null {
    return this.shape.at(key);
  }

  parse(input: unknown, options?: ParserOptions): S['output'] {
    const { applyConstraints } = this;
    const output = this.shape.parse(input, options);

    if (applyConstraints !== null) {
      return returnOrRaiseIssues(output, applyConstraints(input, options, null));
    }
    return output;
  }

  parseAsync(input: unknown, options?: ParserOptions): Promise<S['output']> {
    if (!this.async) {
      return parseAsync(this, input, options);
    }

    const { applyConstraints } = this;
    const promise = this.shape.parseAsync(input, options);

    if (applyConstraints !== null) {
      return promise.then(output => returnOrRaiseIssues(output, applyConstraints(output, options, null)));
    }

    return promise;
  }
}
