import { ApplyResult, Issue, ParseOptions, Shape } from 'doubter';

export abstract class ValidatorShape<T> extends Shape<string> {
  protected abstract _typeIssueFactory: (input: unknown) => Issue;
  protected _typePredicate;
  protected _options;

  protected constructor(typePredicate: (input: any, options?: T) => boolean, initialOptions?: T) {
    super(['string'], false);

    this._typePredicate = typePredicate;
    this._options = initialOptions;
  }

  apply(input: unknown, options: ParseOptions): ApplyResult<string> {
    const { _typePredicate, _applyChecks } = this;

    if (typeof input !== 'string' || !_typePredicate(input, this._options)) {
      return [this._typeIssueFactory(input)];
    }
    if (_applyChecks !== null) {
      return _applyChecks(input, null, options);
    }
    return null;
  }

  protected _clone(options?: T): this {
    const shape = super._clone();
    shape._options = Object.assign({}, shape._options, options);
    return shape;
  }
}
