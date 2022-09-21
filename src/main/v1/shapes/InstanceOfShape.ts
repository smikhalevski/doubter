import { Shape } from './Shape';
import { InputConstraintOptions, ParserOptions } from '../shared-types';
import { raiseIfIssues, raiseIssue } from '../utils';
import { CODE_INSTANCE_OF } from './constants';

type InstanceOf<C> = C extends new (...args: any[]) => infer T ? T : never;

export class InstanceOfShape<C extends new (...args: any[]) => any> extends Shape<InstanceOf<C>> {
  constructor(protected ctor: C, protected options?: InputConstraintOptions | string) {
    super(false);
  }

  parse(input: unknown, options?: ParserOptions): InstanceOf<C> {
    const { ctor } = this;

    if (!(input instanceof ctor)) {
      raiseIssue(input, CODE_INSTANCE_OF, ctor, this.options, 'Must be an instance of ' + ctor.name);
    }

    const { applyConstraints } = this;
    if (applyConstraints !== null) {
      raiseIfIssues(applyConstraints(input, options, null));
    }
    return input;
  }
}
