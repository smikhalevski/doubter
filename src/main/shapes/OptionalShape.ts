import { AnyShape, Shape } from './Shape';
import { INVALID, Issue, ParserOptions } from '../shared-types';
import { captureIssues, parseAsync, returnOrRaiseIssues, raiseOrCaptureIssues } from '../utils';

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

  parse(input: unknown, options?: ParserOptions): S['output'] | O {
    let issues: Issue[] | null = null;
    let output = this.defaultValue;

    if (input !== undefined) {
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
    return returnOrRaiseIssues(output, issues);
  }

  parseAsync(input: unknown, options?: ParserOptions): Promise<S['output'] | O> {
    if (!this.async) {
      return parseAsync(this, input, options);
    }

    const { applyConstraints } = this;

    const promise = input === undefined ? Promise.resolve(this.defaultValue) : this.shape.parseAsync(input, options);

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
      output => returnOrRaiseIssues(output, applyConstraints(output, options, null)),
      error => returnOrRaiseIssues(INVALID, applyConstraints(INVALID, options, captureIssues(error)))
    );
  }
}
