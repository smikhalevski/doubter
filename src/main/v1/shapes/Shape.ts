import { Constraint, ConstraintOptions, Issue, ParserOptions, Transformer } from '../shared-types';
import {
  applyConstraints,
  catchError,
  die,
  dieAsyncParse,
  raiseError,
  raiseIssue,
  raiseUnknownError,
  returnNull,
} from '../utils';
import { ValidationError } from '../ValidationError';

/**
 * An arbitrary shape.
 */
export type AnyShape = Shape<any> | Shape<never>;

export interface Shape<I, O> {
  /**
   * The shape input type. Accessible only at compile time and should be used for type inference.
   */
  readonly input: I;

  /**
   * The shape output type. Accessible only at compile time and should be used for type inference.
   */
  readonly output: O;
}

/**
 * The abstract shape.
 *
 * @template I The input value.
 * @template O The output value.
 */
export abstract class Shape<I, O = I> {
  /**
   * @internal
   */
  protected constraintIds?: Array<string | null>;

  /**
   * @internal
   */
  protected constraints?: Constraint<O>[];

  /**
   * Creates the new {@link Shape}.
   *
   * @param async If `true` that shape would allow only {@link parseAsync} and throw error if {@link parse} is called.
   */
  protected constructor(readonly async: boolean) {
    if (async) {
      this.parse = dieAsyncParse;
    }
  }

  /**
   * Synchronously parses the value.
   *
   * @param input The value to parse.
   * @param options The parsing options.
   * @returns The value that conforms the output type of the shape, or throws a {@link ValidationError} if any issues
   * occur during parsing.
   * @throws Error if the shape doesn't support the synchronous parsing.
   */
  abstract parse(input: unknown, options?: ParserOptions): O;

  /**
   * Asynchronously parses the value.
   *
   * @param input The value to parse.
   * @param options The parsing options.
   * @returns The value that conforms the output type of the shape, or throws a {@link ValidationError} if any issues
   * occur during parsing.
   */
  parseAsync(input: unknown, options?: ParserOptions): Promise<O> {
    return new Promise(resolve => resolve(this.parse(input, options)));
  }

  /**
   * Synchronously checks that the value can be parsed as an output of the shape.
   *
   * @param input The value to validate.
   * @param options The parsing options.
   * @returns The list of detected issues, or `null` if value is valid.
   * @throws Error if the shape doesn't support the synchronous parsing.
   */
  validate(input: unknown, options?: ParserOptions): Issue[] | null {
    try {
      this.parse(input, options);
    } catch (error) {
      raiseUnknownError(error);
      return error.issues;
    }
    return null;
  }

  /**
   * Asynchronously checks that the value can be parsed as an output of the shape.
   *
   * @param input The value to validate.
   * @param options The parsing options.
   * @returns The list of detected issues, or `null` if value is valid.
   */
  validateAsync(input: unknown, options?: ParserOptions): Promise<Issue[] | null> {
    return this.parseAsync(input, options).then(returnNull, catchError);
  }

  /**
   * Synchronously transforms the output value of the shape with a transformer callback.
   *
   * @param transformer The value transformer.
   * @return The transformed shape.
   * @template T The transformed value.
   */
  transform<T>(transformer: Transformer<O, T>): TransformedShape<this, T> {
    return new TransformedShape(this, false, transformer);
  }

  /**
   * Asynchronously transforms the output value of the shape with a transformer callback.
   *
   * @param transformer The value transformer.
   * @return The transformed shape.
   * @template T The transformed value.
   */
  transformAsync<T>(transformer: Transformer<O, Promise<T>>): TransformedShape<this, T> {
    return new TransformedShape(this, true, transformer);
  }

  /**
   * Returns a sub-shape that describes a value at given key, or `null` if there's no such shape.
   *
   * @param key The key for which the sub-shape must be retrieved.
   * @returns The sub-shape or `null`.
   */
  at(key: unknown): AnyShape | null {
    return null;
  }

  /**
   * Copies a shape and adds a constraint to the copy. If there is a constraint with the same ID then it is replaced,
   * otherwise it is appended to the list of constraints. If no ID was specified, or ID is `null`, then the given
   * constraint is always appended to the list of constraints.
   *
   * @param constraint The constraint to add.
   * @param id The constraint identifier.
   * @returns The copy of this shape with the constraint added.
   */
  constrain(constraint: Constraint<O>, id: string | null = null): this {
    const shape = this.clone();
    const { constraintIds = [], constraints = [] } = shape;
    const constraintIndex = constraintIds.indexOf(id);

    if (id === null || constraintIndex === -1) {
      constraintIds.push(id);
      constraints.push(constraint);
    } else {
      constraints[constraintIndex] = constraint;
    }
    return shape;
  }

  /**
   * Narrows the output type of the shape using a type predicate.
   *
   * @param predicate The type predicate that narrows the shape output value.
   * @param options The constraint options.
   * @returns The shape that has the narrowed output value.
   * @template T The narrowed output value.
   */
  narrow<T extends O>(predicate: (output: O) => output is T, options?: ConstraintOptions): Shape<I, T> {
    return this.constrain(output => {
      if (!predicate(output)) {
        raiseIssue(output, 'narrow', undefined, options, 'Must be narrowable');
      }
    }) as unknown as Shape<I, T>;
  }

  /**
   * Returns the clone of the shape.
   */
  clone(): this {
    const shape = Object.assign(Object.create(Object.getPrototypeOf(this)), this);
    const { constraintIds, constraints } = shape;

    if (constraintIds) {
      shape.constraintIds = constraintIds.slice(0);
    }
    if (constraints) {
      shape.constraints = constraints.slice(0);
    }
    return shape;
  }
}

Object.defineProperty(Shape.prototype, 'input', {
  get() {
    die('Cannot be used at runtime');
  },
});

Object.defineProperty(Shape.prototype, 'output', {
  get() {
    die('Cannot be used at runtime');
  },
});

/**
 * The shape that applies a transformed to the output of the base shape.
 *
 * @template S The base shape that provides the output value to transform.
 * @template T The transformed value.
 */
export class TransformedShape<S extends AnyShape, T> extends Shape<S['input'], T> {
  /**
   * Creates the new {@link TransformedShape}.
   *
   * @param shape The base shape.
   * @param async If `true` then transformer must return a promise.
   * @param transformer The transformed callback.
   */
  constructor(protected shape: S, async: boolean, protected transformer: Transformer<S['output'], Promise<T> | T>) {
    super(shape.async || async);
  }

  parse(input: unknown, options?: ParserOptions): T {
    const { shape, transformer, constraints } = this;
    const output = transformer(shape.parse(input, options)) as T;

    if (constraints !== undefined) {
      raiseError(applyConstraints(output, constraints, options, null));
    }
    return output;
  }

  parseAsync(input: unknown, options?: ParserOptions): Promise<T> {
    const { shape, transformer, constraints } = this;
    const outputPromise = shape.parseAsync(input, options).then(transformer);

    if (constraints !== undefined) {
      return outputPromise.then(output => {
        raiseError(applyConstraints(output, constraints, options, null));
        return output;
      });
    }
    return outputPromise;
  }
}
