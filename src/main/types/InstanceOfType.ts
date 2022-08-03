import { Type } from './Type';
import { raiseIssue } from '../utils';
import { ConstraintOptions, ParserOptions } from '../shared-types';

/**
 * The type of the arbitrary constructor.
 */
export type Constructor<T> = new (...args: any[]) => T;

export type InferConstructorType<C> = C extends Constructor<infer T> ? T : never;

/**
 * The class instance type definition.
 *
 * @template C The class instance constructor.
 */
export class InstanceOfType<C extends Constructor<any>> extends Type<InferConstructorType<C>> {
  constructor(protected ctor: C, options?: ConstraintOptions) {
    super(false, options);
  }

  parse(input: unknown, options?: ParserOptions): InferConstructorType<C> {
    const { ctor } = this;

    if (!(input instanceof ctor)) {
      raiseIssue(input, 'instanceOf', ctor, this.options, 'Must be an instance of ' + ctor.name);
    }
    return input;
  }
}
