import { Shape } from './Shape';
import { InputConstraintOptionsOrMessage, ParserOptions } from '../shared-types';
import { raiseIfIssues, raiseIssue } from '../utils';
import { CODE_INSTANCE, MESSAGE_INSTANCE } from './constants';

type InferInstance<F> = F extends new (...args: any[]) => infer T ? T : never;

/**
 * The class instance shape.
 *
 * @template F The class constructor.
 */
export class InstanceShape<F extends new (...args: any[]) => any> extends Shape<InferInstance<F>> {
  constructor(readonly ctor: F, protected options?: InputConstraintOptionsOrMessage) {
    super(false);
  }

  parse(input: unknown, options?: ParserOptions): InferInstance<F> {
    const { ctor, applyConstraints } = this;

    if (!(input instanceof ctor)) {
      raiseIssue(input, CODE_INSTANCE, ctor, this.options, MESSAGE_INSTANCE);
    }

    if (applyConstraints !== null) {
      raiseIfIssues(applyConstraints(input, options, null));
    }
    return input;
  }
}
