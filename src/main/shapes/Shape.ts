import { ParserOptions } from './shared-types';
import { addConstraint, applyConstraints, defineProperty, die } from './utils';
import { Awaitable, ConstraintOptions } from '../shared-types';
import { raiseIssue } from '../utils';

export type Constraint<T> = (input: T) => void;

export type AnyShape = Shape<any> | Shape<never>;

export interface Shape<I, O> {
  readonly input: I;
  readonly output: O;
}

export class Shape<I, O = I> {
  protected constraintIds: string[] = [];
  protected constraints: Constraint<O>[] = [];

  constructor(readonly async: boolean) {}

  parse(input: unknown, options?: ParserOptions): O {
    die('Shape is asynchronous');
  }

  parseAsync(input: unknown, options?: ParserOptions): Promise<O> {
    return new Promise(resolve => resolve(this.parse(input, options)));
  }

  narrow<O2 extends O>(predicate: (value: O) => value is O2, options?: ConstraintOptions): Shape<I, O2>;

  narrow(predicate: (value: O) => boolean, options?: ConstraintOptions): this;

  narrow(predicate: (value: O) => boolean, options?: ConstraintOptions): this {
    return addConstraint(this, undefined, input => {
      if (!predicate(input)) {
        raiseIssue(input, 'narrow', undefined, options, 'Must be narrowable');
      }
    });
  }

  constrain(constraint: Constraint<O>, id?: string): this {
    return addConstraint(this, id, constraint);
  }
}

defineProperty(Shape.prototype, 'input', {
  get() {
    die('Shape.input cannot be used as value');
  },
});

defineProperty(Shape.prototype, 'output', {
  get() {
    die('Shape.output cannot be used as value');
  },
});

export type _Transformer<I, O> = (input: I) => O;

export class TransformedShape<X extends AnyShape, O> extends Shape<X['input'], O> {
  constructor(protected shape: X, async: boolean, protected transformer: _Transformer<X['output'], Awaitable<O>>) {
    super(async || shape.async);
  }

  parse(input: unknown, options?: ParserOptions): O {
    const { shape, transformer, constraints } = this;
    const output = transformer(shape.parse(input, options)) as O;

    if (constraints.length !== 0) {
      applyConstraints(output, constraints, options);
    }
    return output;
  }

  parseAsync(input: unknown, options?: ParserOptions): Promise<O> {
    const { shape, transformer, constraints } = this;

    const promise = shape.parseAsync(input, options).then(transformer);

    if (constraints.length !== 0) {
      return promise.then(output => {
        applyConstraints(output, constraints, options);
        return output;
      });
    }
    return promise;
  }
}
