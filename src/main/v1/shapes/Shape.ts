import { Constraint, ConstraintOptions, ParserOptions } from '../shared-types';
import { addConstraint, applyConstraints, defineProperty, die, dieAsyncParse, raiseIssue } from '../utils';

export type AnyShape = Shape<any> | Shape<never>;

export interface Shape<I, O> {
  readonly input: I;
  readonly output: O;
}

export abstract class Shape<I, O = I> {
  protected constraintIds: string[] | undefined;
  protected constraints: Constraint<O>[] | undefined;

  protected constructor(readonly async: boolean) {
    if (async) {
      this.parse = dieAsyncParse;
    }
  }

  at(key: unknown): AnyShape | null {
    return null;
  }

  abstract parse(input: unknown, options?: ParserOptions): O;

  parseAsync(input: unknown, options?: ParserOptions): Promise<O> {
    return new Promise(resolve => resolve(this.parse(input, options)));
  }

  narrow<O2 extends O>(predicate: (value: O) => value is O2, options?: ConstraintOptions): Shape<I, O2> {
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

    if (constraints !== undefined) {
      const error = applyConstraints(output, constraints, options, null);
      if (error !== undefined) {
        throw error;
      }
    }
    return output;
  }

  parseAsync(input: unknown, options?: ParserOptions): Promise<O> {
    const { shape, transformer, constraints } = this;

    const promise = shape.parseAsync(input, options).then(transformer);

    if (constraints !== undefined) {
      return promise.then(output => {
        const error = applyConstraints(output, constraints, options, null);

        if (error !== undefined) {
          throw error;
        }
        return output;
      });
    }
    return promise;
  }
}
