import { ApplyResult, ParserOptions } from '../shared-types';
import { raiseIssue } from '../shape-utils';
import { StringShape } from './StringShape';

const emailRegex =
  /^(([^<>()[\].,;:\s@"]+(\.[^<>()[\].,;:\s@"]+)*)|(".+"))@(([^<>()[\].,;:\s@"]+\.)+[^<>()[\].,;:\s@"]{2,})$/i;

export class EmailShape extends StringShape {
  _apply(input: unknown, options: ParserOptions): ApplyResult<string> {
    const { _applyChecks } = this;

    if (typeof input !== 'string' || !emailRegex.test(input)) {
      return raiseIssue(this._typeCheckConfig, input);
    }
    if (_applyChecks !== null) {
      return _applyChecks(input, null, options);
    }
    return null;
  }
}
