import { ApplyResult, ParseOptions } from '../shared-types';
import { raiseIssue } from '../shape-utils';
import { StringShape } from './StringShape';

const emailRegex =
  /^(([^<>()[\].,;:\s@"]+(\.[^<>()[\].,;:\s@"]+)*)|(".+"))@(([^<>()[\].,;:\s@"]+\.)+[^<>()[\].,;:\s@"]{2,})$/i;

export class EmailShape extends StringShape {
  apply(input: unknown, options: ParseOptions): ApplyResult<string> {
    const { applyChecks } = this;

    if (typeof input !== 'string' || !emailRegex.test(input)) {
      return raiseIssue(this._typeCheckConfig, input);
    }
    if (applyChecks !== null) {
      return applyChecks(input, null, options);
    }
    return null;
  }
}
