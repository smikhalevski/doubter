import { ApplyResult, ParseOptions } from '../shared-types';
import { isArray, ok } from '../utils';
import { AnyShape, Shape } from './Shape';

export class DefaultableShape<S extends AnyShape, I, O> extends Shape<S['input'] | I, S['output'] | O> {
  private _defaultResult: ApplyResult<O>;
  private _defaultAsyncResult: Promise<ApplyResult<O>> | undefined;

  constructor(readonly shape: S, readonly replacedValue: I, readonly defaultValue?: O) {
    super(shape.async);

    this._defaultResult = defaultValue === undefined || defaultValue === replacedValue ? null : ok(defaultValue);

    if (shape.async) {
      this._defaultAsyncResult = Promise.resolve(this._defaultResult);
    }
  }

  apply(input: unknown, options: ParseOptions): ApplyResult<S['output'] | O> {
    const { applyChecks } = this;

    let issues;
    let output = input;

    const result = input === this.replacedValue ? this._defaultResult : this.shape.apply(input, options);

    if (result !== null) {
      if (isArray(result)) {
        return result;
      }
      output = result.value;
    }

    if (applyChecks !== null) {
      issues = applyChecks(output, null, options);

      if (issues !== null) {
        return issues;
      }
    }
    return result;
  }

  applyAsync(input: unknown, options: ParseOptions): Promise<ApplyResult<S['output'] | O>> {
    const { applyChecks } = this;

    let issues;

    if (input === this.replacedValue) {
      if (applyChecks !== null) {
        return new Promise(resolve => {
          issues = applyChecks(this.defaultValue, null, options);

          resolve(issues !== null ? issues : this._defaultResult);
        });
      }
      return this._defaultAsyncResult!;
    }

    return this.shape.applyAsync(input, options).then(result => {
      let issues;
      let output = input;

      if (result !== null) {
        if (isArray(result)) {
          return result;
        }
        output = result.value;
      }

      if (applyChecks !== null) {
        issues = applyChecks(output, null, options);

        if (issues !== null) {
          return issues;
        }
      }
      return result;
    });
  }
}
