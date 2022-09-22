import { AnyShape, Shape } from './Shape';
import { OptionalShape } from './OptionalShape';
import { INVALID, Issue, ParserOptions } from '../shared-types';
import { captureIssues, parseAsync, raiseIfIssues, raiseOrCaptureIssues } from '../utils';

export class NullableShape<S extends AnyShape> extends Shape<S['input'] | null, S['output'] | null> {
  constructor(readonly shape: S) {
    super(shape.async);
  }

  at(key: unknown): AnyShape | null {
    const shape = this.shape.at(key);
    return shape === null ? null : new OptionalShape(shape);
  }

  parse(input: unknown, options?: ParserOptions): S['output'] | null {
    let issues: Issue[] | null = null;
    let output = null;

    if (input !== null) {
      try {
        output = this.shape.parse(input, options);
      } catch (error) {
        issues = raiseOrCaptureIssues(error, options, null);
        output = INVALID;
      }
    }

    const { applyConstraints } = this;
    if (applyConstraints !== null) {
      issues = applyConstraints(output, options, issues);
    }
    raiseIfIssues(issues);

    return output;
  }

  parseAsync(input: unknown, options?: ParserOptions): Promise<S['output'] | null> {
    if (!this.async) {
      return parseAsync(this, input, options);
    }

    const { applyConstraints } = this;

    const promise = input === null ? Promise.resolve(null) : this.shape.parseAsync(input, options);

    if (applyConstraints === null) {
      return promise;
    }

    if (options !== undefined && options.fast) {
      return promise.then(output => {
        applyConstraints(output, options, null);
        return output;
      });
    }

    return promise.then(
      output => {
        raiseIfIssues(applyConstraints(output, options, null));
        return output;
      },
      error => {
        raiseIfIssues(applyConstraints(INVALID, options, captureIssues(error)));
      }
    );
  }
}
