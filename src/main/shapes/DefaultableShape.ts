import { ApplyResult, ParseOptions } from '../shared-types';
import { ok } from '../shape-utils';
import { isArray } from '../lang-utils';
import { AnyShape, Shape } from './Shape';

export class DefaultableShape<S extends AnyShape, I, O> extends Shape<I, O> {
  private _defaultResult: ApplyResult<O>;
  private _defaultAsyncResult: Promise<ApplyResult<O>> | undefined;

  constructor(readonly shape: S, private _replacedValue: I, readonly defaultValue?: O) {
    super(shape.async);

    this._defaultResult = defaultValue === undefined || defaultValue === _replacedValue ? null : ok(defaultValue);

    if (shape.async) {
      this._defaultAsyncResult = Promise.resolve(this._defaultResult);
    }
  }

  apply(input: unknown, options: ParseOptions): ApplyResult<O> {
    const { applyChecks } = this;

    let issues;
    let output = input;

    const result = input === this._replacedValue ? this._defaultResult : this.shape.apply(input, options);

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

  applyAsync(input: unknown, options: ParseOptions): Promise<ApplyResult<O>> {
    const { applyChecks } = this;

    let issues;

    if (input === this._replacedValue) {
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
