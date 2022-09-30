import { AnyShape, Shape } from './Shape';
import { OptionalShape } from './OptionalShape';
import { INVALID, Issue, ParserOptions } from '../shared-types';
import { applySafeParseAsync, isEarlyReturn, returnIssues, returnValueOrRaiseIssues } from '../utils';
import { isValidationError, ValidationError } from '../ValidationError';

export class NullableShape<S extends AnyShape> extends Shape<S['input'] | null, S['output'] | null> {
  constructor(readonly shape: S) {
    super(shape.async);
  }

  at(key: unknown): AnyShape | null {
    const shape = this.shape.at(key);
    return shape === null ? null : new OptionalShape(shape);
  }

  safeParse(input: unknown, options?: ParserOptions): S['output'] | null | ValidationError {
    let issues: Issue[] | null = null;
    let output = null;

    if (input !== null) {
      output = this.shape.safeParse(input, options);

      if (isValidationError(output)) {
        if (isEarlyReturn(options)) {
          return output;
        }
        issues = output.issues;
        output = INVALID;
      }
    }

    const { _applyConstraints } = this;
    if (_applyConstraints !== null) {
      issues = _applyConstraints(output, options, issues);
    }

    return returnValueOrRaiseIssues(output, issues);
  }

  safeParseAsync(input: unknown, options?: ParserOptions): Promise<S['output'] | null | ValidationError> {
    if (!this.async) {
      return applySafeParseAsync(this, input, options);
    }

    const { _applyConstraints } = this;

    const promise = input === null ? Promise.resolve(null) : this.shape.parseAsync(input, options);

    if (_applyConstraints === null) {
      return promise;
    }

    if (isEarlyReturn(options)) {
      return promise.then(output => returnValueOrRaiseIssues(output, _applyConstraints(output, options, null)));
    }

    return promise.then(
      output => returnValueOrRaiseIssues(output, _applyConstraints(output, options, null)),
      error => returnValueOrRaiseIssues(INVALID, _applyConstraints(INVALID, options, returnIssues(error)))
    );
  }
}
