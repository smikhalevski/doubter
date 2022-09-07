import { Shape } from './Shape';
import { ConstraintOptions, ParserOptions } from './shared-types';
import { raiseIssue } from './utils';

export type InstanceOf<C> = C extends new (...args: any[]) => infer T ? T : never;

export class InstanceOfShape<C extends new (...args: any[]) => any> extends Shape<InstanceOf<C>> {
  constructor(protected ctor: C, protected options?: ConstraintOptions | string) {
    super(false);
  }

  parse(input: unknown, options?: ParserOptions): InstanceOf<C> {
    const { ctor } = this;

    if (!(input instanceof ctor)) {
      raiseIssue(input, 'instanceOf', ctor, this.options, 'Must be an instance of ' + ctor.name);
    }
    return input;
  }
}
