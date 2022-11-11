import { ApplyResult, Issue, ParseOptions } from '../shared-types';
import { StringShape } from './StringShape';

/**
 * @internal
 */
export class RegexShape extends StringShape {
  constructor(readonly re: RegExp, protected _typeIssueFactory: (input: unknown) => Issue) {
    super();
  }

  apply(input: unknown, options: ParseOptions): ApplyResult<string> {
    const { _applyChecks } = this;

    if (typeof input !== 'string' || !this.re.test(input)) {
      return [this._typeIssueFactory(input)];
    }
    if (_applyChecks !== null) {
      return _applyChecks(input, null, options);
    }
    return null;
  }
}
