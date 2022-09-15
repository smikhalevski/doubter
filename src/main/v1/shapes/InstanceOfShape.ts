import { Shape } from './Shape';
import { InputConstraintOptions, ParserOptions } from '../shared-types';
import { applyConstraints, raiseIssue, raiseOnError } from '../utils';
import { INSTANCE_OF_CODE } from './issue-codes';

export type InstanceOfShapeOutput<C> = C extends new (...args: any[]) => infer T ? T : never;

export class InstanceOfShape<C extends new (...args: any[]) => any> extends Shape<InstanceOfShapeOutput<C>> {
  constructor(protected ctor: C, protected options?: InputConstraintOptions | string) {
    super(false);
  }

  parse(input: unknown, options?: ParserOptions): InstanceOfShapeOutput<C> {
    const { ctor } = this;

    if (!(input instanceof ctor)) {
      raiseIssue(input, INSTANCE_OF_CODE, ctor, this.options, 'Must be an instance of ' + ctor.name);
    }

    const { constraints } = this;
    if (constraints !== null) {
      raiseOnError(applyConstraints(input, constraints, options, null));
    }
    return input;
  }
}
