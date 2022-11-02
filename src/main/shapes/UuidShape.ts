import { ApplyResult, ParseOptions } from '../shared-types';
import { raiseIssue } from '../shape-utils';
import { StringShape } from './StringShape';

const uuidRegex =
  /^([a-f0-9]{8}-[a-f0-9]{4}-[1-5][a-f0-9]{3}-[a-f0-9]{4}-[a-f0-9]{12}|00000000-0000-0000-0000-000000000000)$/i;

export class UuidShape extends StringShape {
  apply(input: unknown, options: ParseOptions): ApplyResult<string> {
    const { applyChecks } = this;

    if (typeof input !== 'string' || !uuidRegex.test(input)) {
      return raiseIssue(this._typeCheckConfig, input);
    }
    if (applyChecks !== null) {
      return applyChecks(input, null, options);
    }
    return null;
  }
}
