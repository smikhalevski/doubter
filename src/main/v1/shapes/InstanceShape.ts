import { Shape } from './Shape';
import { InputConstraintOptions, ParserOptions } from '../shared-types';
import { raiseIfIssues, raiseIssue } from '../utils';
import { CODE_INSTANCE, MESSAGE_INSTANCE } from './constants';

type InferInstance<F> = F extends new (...args: any[]) => infer T ? T : never;

/**
 * The class instance shape.
 *
 * @template F The class constructor.
 */
export class InstanceShape<F extends new (...args: any[]) => any> extends Shape<InferInstance<F>> {
  constructor(readonly ctor: F, protected options?: InputConstraintOptions | string) {
    super(false);
  }

  parse(input: unknown, options?: ParserOptions): InferInstance<F> {
    const { ctor } = this;

    if (!(input instanceof ctor)) {
      raiseIssue(input, CODE_INSTANCE, ctor, this.options, MESSAGE_INSTANCE + ctor.name);
    }

    const { applyConstraints } = this;
    if (applyConstraints !== null) {
      raiseIfIssues(applyConstraints(input, options, null));
    }
    return input;
  }
}
