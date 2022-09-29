import { AnyShape, Shape } from './Shape';
import { INVALID, Issue, ParserOptions } from '../shared-types';
import {
  applySafeParseAsync,
  isEarlyReturn,
  returnOrRaiseIssues,
  throwOrCaptureIssues,
  throwOrReturnIssues,
} from '../utils';
import { ValidationError } from '../ValidationError';

export class OptionalShape<S extends AnyShape, O extends S['output'] | undefined = undefined> extends Shape<
  S['input'] | undefined,
  S['output'] | O
> {
  constructor(readonly shape: S, readonly defaultValue?: O) {
    super(shape.async);
  }

  at(key: unknown): AnyShape | null {
    const shape = this.shape.at(key);
    return shape === null ? null : new OptionalShape(shape, this.defaultValue?.[key as keyof O]);
  }

  safeParse(input: unknown, options?: ParserOptions): S['output'] | O | ValidationError {
    let issues: Issue[] | null = null;
    let output = this.defaultValue;

    if (input !== undefined) {
      try {
        output = this.shape.safeParse(input, options);
      } catch (error) {
        issues = throwOrCaptureIssues(error, options, null);
        output = INVALID;
      }
    }

    const { _applyConstraints } = this;
    if (_applyConstraints !== null) {
      issues = _applyConstraints(output, options, issues);
    }
    return returnOrRaiseIssues(output, issues);
  }

  safeParseAsync(input: unknown, options?: ParserOptions): Promise<S['output'] | O | ValidationError> {
    if (!this.async) {
      return applySafeParseAsync(this, input, options);
    }

    const { _applyConstraints } = this;

    const promise =
      input === undefined ? Promise.resolve(this.defaultValue) : this.shape.safeParseAsync(input, options);

    if (_applyConstraints === null) {
      return promise;
    }

    if (isEarlyReturn(options)) {
      return promise.then(output => {
        _applyConstraints(output, options, null);
        return output;
      });
    }

    return promise.then(
      output => returnOrRaiseIssues(output, _applyConstraints(output, options, null)),
      error => returnOrRaiseIssues(INVALID, _applyConstraints(INVALID, options, throwOrReturnIssues(error)))
    );
  }
}
