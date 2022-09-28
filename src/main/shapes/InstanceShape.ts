import { Shape } from './Shape';
import { InputConstraintOptionsOrMessage, ParserOptions } from '../shared-types';
import { raiseIssue, returnOrRaiseIssues } from '../utils';
import { CODE_INSTANCE, MESSAGE_INSTANCE } from './constants';
import { ValidationError } from '../ValidationError';

type InferInstance<F> = F extends new (...args: any[]) => infer T ? T : never;

/**
 * The class instance shape.
 *
 * @template F The class constructor.
 */
export class InstanceShape<F extends new (...args: any[]) => any> extends Shape<InferInstance<F>> {
  constructor(readonly ctor: F, protected _options?: InputConstraintOptionsOrMessage) {
    super(false);
  }

  safeParse(input: unknown, options?: ParserOptions): InferInstance<F> | ValidationError {
    const { ctor, _applyConstraints } = this;

    if (!(input instanceof ctor)) {
      return raiseIssue(input, CODE_INSTANCE, ctor, this._options, MESSAGE_INSTANCE);
    }
    if (_applyConstraints !== null) {
      return returnOrRaiseIssues(input, _applyConstraints(input, options, null));
    }
    return input;
  }
}
