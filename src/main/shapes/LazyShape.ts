import { AnyShape, Shape } from './Shape';
import { ParserOptions } from '../shared-types';
import { applySafeParseAsync, returnValueOrRaiseIssues } from '../utils';
import { ValidationError } from '../ValidationError';

/**
 * The lazily-evaluated shape.
 *
 * @template S The lazily loaded shape.
 */
export class LazyShape<S extends AnyShape> extends Shape<S['input'], S['output']> {
  constructor(async: boolean, protected _provider: () => S) {
    super(async);
  }

  protected _shape: S | undefined;

  get shape() {
    return (this._shape ||= this._provider());
  }

  at(key: unknown): AnyShape | null {
    return this.shape.at(key);
  }

  safeParse(input: unknown, options?: ParserOptions): S['output'] | ValidationError {
    const { _applyConstraints } = this;
    const output = this.shape.safeParse(input, options);

    if (_applyConstraints !== null) {
      return returnValueOrRaiseIssues(output, _applyConstraints(input, options, null));
    }
    return output;
  }

  safeParseAsync(input: unknown, options?: ParserOptions): Promise<S['output'] | ValidationError> {
    if (!this.async) {
      return applySafeParseAsync(this, input, options);
    }

    const { _applyConstraints } = this;
    const promise = this.shape.safeParseAsync(input, options);

    if (_applyConstraints !== null) {
      return promise.then(output => returnValueOrRaiseIssues(output, _applyConstraints(output, options, null)));
    }

    return promise;
  }
}
