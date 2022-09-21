import { Shape } from './Shape';
import { InputConstraintOptions, ParserOptions } from '../shared-types';
import { raiseIfIssues, raiseIssue } from '../utils';
import { INSTANCE_OF_CODE } from './issue-codes';

type InstanceOf<C> = C extends new (...args: any[]) => infer T ? T : never;

export class InstanceOfShape<C extends new (...args: any[]) => any> extends Shape<InstanceOf<C>> {
  constructor(protected ctor: C, protected options?: InputConstraintOptions | string) {
    super(false);
  }

  parse(input: unknown, options?: ParserOptions): InstanceOf<C> {
    const { ctor } = this;

    if (!(input instanceof ctor)) {
      raiseIssue(input, INSTANCE_OF_CODE, ctor, this.options, 'Must be an instance of ' + ctor.name);
    }

    const { applyConstraints } = this;
    if (applyConstraints !== null) {
      raiseIfIssues(applyConstraints(input, options, null));
    }
    return input;
  }
}
