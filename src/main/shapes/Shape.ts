import {
  ApplyConstraints,
  Constraint,
  IdentifiableConstraintOptions,
  Issue,
  NarrowingConstraintOptions,
  ParserOptions,
  Transformer,
} from '../shared-types';
import {
  addConstraint,
  captureIssues,
  createApplyConstraints,
  isObjectLike,
  parseAsync,
  raise,
  raiseIfIssues,
  raiseIfUnknownError,
  raiseIssue,
} from '../utils';
import { CODE_NARROWING } from './constants';

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
   * Applies shape constraints to the output.
   */
  protected applyConstraints: ApplyConstraints<O> | null = null;

  private constraints: any[] = [];

  /**
   * Creates the new {@linkcode Shape}.
   *
   * @param async If `true` then the shape would allow only {@linkcode parseAsync} and throw an error if
   * {@linkcode parse} is called.
   */
  constructor(readonly async: boolean) {
    if (async) {
      this.parse = raiseParseIsUnsupported;
    }
  }

  /**
   * Synchronously parses the value.
   *
   * @param input The value to parse.
   * @param options Parsing options.
   * @returns The value that conforms the output type of the shape.
   * @throws Error if the shape doesn't support the synchronous parsing.
   * @throws {@linkcode ValidationError} if any issues occur during parsing.
   */
  abstract parse(input: unknown, options?: ParserOptions): O;

  /**
   * Asynchronously parses the value.
   *
   * @param input The value to parse.
   * @param options Parsing options.
   * @returns The value that conforms the output type of the shape.
   * @throws {@linkcode ValidationError} if any issues occur during parsing.
   */
  parseAsync(input: unknown, options?: ParserOptions): Promise<O> {
    return parseAsync(this, input, options);
  }

  /**
   * Synchronously checks that the value can be parsed as an output of the shape.
   *
   * @param input The value to validate.
   * @param options Parsing options.
   * @returns The list of detected issues, or `null` if value is valid.
   * @throws Error if the shape doesn't support the synchronous parsing.
   */
  validate(input: unknown, options?: ParserOptions): Issue[] | null {
    try {
      this.parse(input, options);
    } catch (error) {
      raiseIfUnknownError(error);
      return error.issues;
    }
    return null;
  }

  /**
   * Asynchronously checks that the value can be parsed as an output of the shape.
   *
   * @param input The value to validate.
   * @param options Parsing options.
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
   * @param key The key for which the sub-shape must be retrieved.
   * @returns The sub-shape or `null` if there's no such key in the shape.
   */
  at(key: unknown): AnyShape | null {
    return null;
  }

  /**
   * Adds a custom constraint.
   *
   * @param constraint The constraint to add.
   * @param options The constraint options.
   * @returns The clone of this shape with the constraint added.
   */
  constrain(constraint: Constraint<O>, options?: IdentifiableConstraintOptions): this {
    const constraints = this.constraints.slice(0);

    if (isObjectLike(options)) {
      const { id = null, unsafe = false } = options;

      if (id !== null) {
        for (let i = 0; i < constraints.length; i += 3) {
          if (constraints[i] === id) {
            constraints.splice(i, 3);
            break;
          }
        }
      }

      constraints.push(id, unsafe, constraint);
    } else {
      constraints.push(null, false, constraint);
    }

    const shape = this.clone();

    shape.constraints = constraints;
    shape.applyConstraints = createApplyConstraints(constraints);

    return shape;
  }

  /**
   * Adds a constraint that [narrows the shape output type](https://www.typescriptlang.org/docs/handbook/2/narrowing.html)
   * of using a type predicate.
   *
   * @param predicate The type predicate that returns `true` if value conforms the required type, or `false` otherwise.
   * @param options The constraint options or an issue message.
   * @returns The shape that has the narrowed output.
   * @template T The narrowed value.
   */
  narrow<T extends O>(
    predicate: (output: O) => output is T,
    options?: NarrowingConstraintOptions | string
  ): Shape<I, T> {
    return addConstraint(this, isObjectLike(options) ? options.id : undefined, options, output => {
      if (!predicate(output)) {
        raiseIssue(output, CODE_NARROWING, predicate, options, 'Must conform the narrowing predicate');
      }
    }) as unknown as Shape<I, T>;
  }

  /**
   * Adds a constraint that [narrows the shape output type](https://www.typescriptlang.org/docs/handbook/2/narrowing.html)
   * of using an [assertion function](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-7.html#assertion-functions).
   *
   * @param predicate The assertion function that throws a {@linkcode ValidationError} or returns `undefined`.
   * @param options The constraint options.
   * @returns The shape that has the narrowed output.
   * @template T The refined value.
   */
  assert<T extends O>(
    predicate: (output: O) => asserts output is T,
    options?: IdentifiableConstraintOptions
  ): Shape<I, T> {
    return addConstraint(this, options?.id, options, predicate) as unknown as Shape<I, T>;
  }

  /**
   * Returns the shape clone.
   */
  clone(): this {
    return Object.assign(Object.create(Object.getPrototypeOf(this)), this);
  }
}

function raiseParseIsUnsupported(): never {
  raise('Shape is asynchronous');
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
  private transformer: Transformer<any, any>;

  /**
   * Creates the new {@linkcode TransformedShape}.
   *
   * @param shape The base shape.
   * @param async If `true` then transformer must return a promise.
   * @param transformer The transformed callback.
   */
  constructor(protected shape: Shape<I, O>, async: boolean, transformer: Transformer<O, Promise<T> | T>) {
    super(shape.async || async);
    this.transformer = transformer;
  }

  parse(input: unknown, options?: ParserOptions): T {
    const { shape, transformer, applyConstraints } = this;
    const output = transformer(shape.parse(input, options)) as T;

    if (applyConstraints !== null) {
      raiseIfIssues(applyConstraints(output, options, null));
    }
    return output;
  }

  parseAsync(input: unknown, options?: ParserOptions): Promise<T> {
    const { shape, transformer, applyConstraints } = this;
    const promise = shape.parseAsync(input, options).then(transformer);

    if (applyConstraints !== null) {
      return promise.then(output => {
        raiseIfIssues(applyConstraints(output, options, null));
        return output;
      });
    }
    return promise;
  }
}
