import {
  Constraint,
  CustomConstraintOptions,
  Issue,
  NarrowingConstraintOptions,
  ParserOptions,
  Transformer,
} from '../shared-types';
import { addConstraint, applyConstraints, raise, raiseIssue, raiseOnError, raiseOnUnknownError } from '../utils';
import { NARROWING_CODE } from './issue-codes';

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
   * Constraints are stored as an array of repeated triplets: constraint name, an unsafe flag, and a constraint callback.
   * For performance reasons, the array of constraints must not be empty, so use `null` if there are no constraints.
   */
  protected constraints: any[] | null = null;

  /**
   * Creates the new {@linkcode Shape}.
   *
   * @param async If `true` then the shape would allow only {@linkcode parseAsync} and throw an error if
   * {@linkcode parse} is called.
   */
  protected constructor(
    /**
     * `true` when the shape allows only {@linkcode parseAsync} and throws an error if {@linkcode parse} is called.
     */
    readonly async: boolean
  ) {
    if (async) {
      this.parse = raiseParseUnsupported;
    }
  }

  /**
   * Synchronously parses the value.
   *
   * @param input The value to parse.
   * @param options The parsing options.
   * @returns The value that conforms the output type of the shape.
   * @throws Error if the shape doesn't support the synchronous parsing.
   * @throws {@linkcode ValidationError} if any issues occur during parsing.
   */
  abstract parse(input: unknown, options?: ParserOptions): O;

  /**
   * Asynchronously parses the value.
   *
   * @param input The value to parse.
   * @param options The parsing options.
   * @returns The value that conforms the output type of the shape.
   * @throws {@linkcode ValidationError} if any issues occur during parsing.
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
      raiseOnUnknownError(error);
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
    return this.parseAsync(input, options).then(returnNull, captureIssues);
  }

  /**
   * Synchronously transforms the output value of the shape with a transformer callback.
   *
   * @param transformer The value transformer callback.
   * @return The transformed shape.
   * @template T The transformed value.
   */
  transform<T>(transformer: Transformer<O, T>): TransformedShape<I, O, T> {
    return new TransformedShape(this, false, transformer);
  }

  /**
   * Asynchronously transforms the output value of the shape with a transformer callback.
   *
   * @param transformer The value transformer callback.
   * @return The transformed shape.
   * @template T The transformed value.
   */
  transformAsync<T>(transformer: Transformer<O, Promise<T>>): TransformedShape<I, O, T> {
    return new TransformedShape(this, true, transformer);
  }

  /**
   * Returns a sub-shape that describes a value at an object property name, or `null` if there's no such shape.
   *
   * @param propertyName The key for which the sub-shape must be retrieved.
   * @returns The sub-shape or `null` if there's no such key in the shape.
   */
  at(propertyName: unknown): AnyShape | null {
    return null;
  }

  /**
   * Adds a custom constraint.
   *
   * @param constraint The constraint to add.
   * @param options The constraint options.
   * @returns The clone of this shape with the constraint added.
   */
  constrain(constraint: Constraint<O>, options?: CustomConstraintOptions): this {
    const shape = this.clone();
    const constraints = (shape.constraints ||= []);

    let name = null;
    let unsafe = false;

    if (options != null) {
      unsafe = options.unsafe || false;

      if (options.name != null) {
        name = options.name;

        for (let i = 0; i < constraints.length; i += 3) {
          if (constraints[i] === name) {
            constraints.splice(i, 3);
            break;
          }
        }
      }
    }

    constraints.push(name, unsafe, constraint);
    return shape;
  }

  /**
   * Adds a constraint that [narrows the shape output type](https://www.typescriptlang.org/docs/handbook/2/narrowing.html)
   * of using a type predicate.
   *
   * @param predicate The type predicate that returns `true` if value conforms the required type, or `false` otherwise.
   * @param options The constraint options or an issue message.
   * @returns The shape that has the narrowed output value.
   * @template T The narrowed value.
   */
  narrow<T extends O>(
    predicate: (output: O) => output is T,
    options?: NarrowingConstraintOptions | string
  ): Shape<I, T> {
    return addConstraint(this, typeof options === 'object' ? options.name : undefined, options, output => {
      if (!predicate(output)) {
        raiseIssue(output, NARROWING_CODE, predicate, options, 'Must conform the narrowing predicate');
      }
    }) as unknown as Shape<I, T>;
  }

  /**
   * Adds a constraint that [narrows the shape output type](https://www.typescriptlang.org/docs/handbook/2/narrowing.html)
   * of using an [assertion function](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-7.html#assertion-functions).
   *
   * @param callback The assertion function that throws a {@linkcode ValidationError} or returns `undefined`.
   * @param options The constraint options.
   * @returns The shape that has the refined output value.
   * @template T The refined value.
   */
  assert<T extends O>(callback: (output: O) => asserts output is T, options?: CustomConstraintOptions): Shape<I, T> {
    return addConstraint(this, options?.name, options, callback) as unknown as Shape<I, T>;
  }

  /**
   * Returns the shape clone.
   */
  clone(): this {
    const shape: this = Object.assign(Object.create(Object.getPrototypeOf(this)), this);
    const { constraints } = shape;

    if (constraints !== null) {
      shape.constraints = constraints.slice(0);
    }
    return shape;
  }
}

function raiseParseUnsupported(): never {
  raise('Shape is asynchronous');
}

function captureIssues(error: unknown): Issue[] {
  raiseOnUnknownError(error);
  return error.issues;
}

function returnNull(): null {
  return null;
}

Object.defineProperty(Shape.prototype, 'input', {
  get() {
    raise('Cannot be used at runtime');
  },
});

Object.defineProperty(Shape.prototype, 'output', {
  get() {
    raise('Cannot be used at runtime');
  },
});

/**
 * The shape that applies a transformer to the output of the base shape.
 *
 * @template I The base shape input value.
 * @template O The base shape output value.
 * @template T The transformed value.
 */
export class TransformedShape<I, O, T> extends Shape<I, T> {
  /**
   * Creates the new {@linkcode TransformedShape}.
   *
   * @param shape The base shape.
   * @param async If `true` then transformer must return a promise.
   * @param transformer The transformed callback.
   */
  constructor(protected shape: Shape<I, O>, async: boolean, protected transformer: Transformer<O, Promise<T> | T>) {
    super(shape.async || async);
  }

  parse(input: unknown, options?: ParserOptions): T {
    const { shape, transformer, constraints } = this;
    const output = transformer(shape.parse(input, options)) as T;

    if (constraints !== null) {
      raiseOnError(applyConstraints(output, constraints, options, null));
    }
    return output;
  }

  parseAsync(input: unknown, options?: ParserOptions): Promise<T> {
    const { shape, transformer, constraints } = this;
    const outputPromise = shape.parseAsync(input, options).then(transformer);

    if (constraints !== null) {
      return outputPromise.then(output => {
        raiseOnError(applyConstraints(output, constraints, options, null));
        return output;
      });
    }
    return outputPromise;
  }
}
