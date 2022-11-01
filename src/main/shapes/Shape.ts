import {
  ApplyConstraints,
  Constraint,
  IdentifiableConstraintOptions,
  Issue,
  NarrowingOptionsOrMessage,
  ParserOptions,
  Transformer,
} from '../shared-types';
import {
  appendConstraint,
  applySafeParseAsync,
  createApplyConstraints,
  createIssue,
  returnError,
  returnValueOrRaiseIssues,
  throwError,
  throwIfUnknownError,
} from '../utils';
import { CODE_NARROWING, MESSAGE_NARROWING } from '../v3/shapes/constants';
import { isValidationError, ValidationError } from '../ValidationError';
import { objectAssign, createObject, defineProperty } from '../lang-utils';

/**
 * An arbitrary shape.
 */
export type AnyShape = Shape | Shape<never>;

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
 * The most basic shape that applies constraints to the input without any additional checks.
 *
 * @template I The input value.
 * @template O The output value.
 */
export class Shape<I = any, O = I> {
  /**
   * Applies shape constraints to the output.
   */
  protected _applyConstraints: ApplyConstraints | null = null;

  /**
   * Inlined triplets of an ID, an unsafe flag and a constraint callback.
   */
  protected _constraints: any[] = [];

  /**
   * Creates the new {@linkcode Shape}.
   *
   * @param async If `true` then the shape allows only asynchronous parsing and would throw an error if a synchronous
   * alternative is called.
   */
  constructor(readonly async: boolean) {
    if (async) {
      this.safeParse = throwSynchronousParsingIsUnsupported;
    }
  }

  /**
   * Synchronously parses the value.
   *
   * @param input The value to parse.
   * @param options Parsing options.
   * @returns The value that conforms the output type of the shape, or {@linkcode ValidationError} if any issues occur
   * during parsing.
   * @throws Error if the shape doesn't support the synchronous parsing.
   */
  safeParse(input: any, options?: ParserOptions): O | ValidationError {
    const { _applyConstraints } = this;
    if (_applyConstraints !== null) {
      return returnValueOrRaiseIssues(input, _applyConstraints(input, options, null));
    }
    return input;
  }

  /**
   * Asynchronously parses the value.
   *
   * @param input The value to parse.
   * @param options Parsing options.
   * @returns The value that conforms the output type of the shape, or {@linkcode ValidationError} if any issues occur
   * during parsing.
   */
  safeParseAsync(input: unknown, options?: ParserOptions): Promise<O | ValidationError> {
    return applySafeParseAsync(this, input, options);
  }

  /**
   * Synchronously parses the value.
   *
   * @param input The value to parse.
   * @param options Parsing options.
   * @returns The value that conforms the output type of the shape.
   * @throws {@linkcode ValidationError} if any issues occur during parsing.
   * @throws Error if the shape doesn't support the synchronous parsing.
   */
  parse(input: unknown, options?: ParserOptions): O {
    return returnValueOrThrow(this.safeParse(input, options));
  }

  /**
   * Asynchronously parses the value.
   *
   * @param input The value to parse.
   * @param options Parsing options.
   * @returns The value that conforms the output type of the shape.
   * @throws {@linkcode ValidationError} if any issues occur during parsing.
   */
  parseAsync(input: unknown, options?: ParserOptions): Promise<O> {
    return this.safeParseAsync(input, options).then(returnValueOrThrow);
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
    return extractIssues(this.safeParse(input, options));
  }

  /**
   * Asynchronously checks that the value can be parsed as an output of the shape.
   *
   * @param input The value to validate.
   * @param options Parsing options.
   * @returns The list of detected issues, or `null` if value is valid.
   */
  validateAsync(input: unknown, options?: ParserOptions): Promise<Issue[] | null> {
    return this.safeParseAsync(input, options).then(extractIssues);
  }

  /**
   * Synchronously transforms the output value of the shape with a transformer callback. The callback may throw
   * {@linkcode ValidationError} to notify that the transformation cannot be successfully completed.
   *
   * @param transformer The transformation callback.
   * @return The transformed shape.
   * @template T The transformed value.
   */
  transform<T>(transformer: Transformer<O, T>): TransformedShape<I, O, T> {
    return new TransformedShape(this, false, transformer);
  }

  /**
   * Asynchronously transforms the output value of the shape with a transformer callback. The callback may throw
   * {@linkcode ValidationError} to notify that the transformation cannot be successfully completed.
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
   * @param options The constraint options or an issue message.
   * @returns The clone of this shape with the constraint added.
   */
  constrain(constraint: Constraint<O>, options?: IdentifiableConstraintOptions): this {
    const constraints = this._constraints.slice(0);

    let id;
    let unsafe = false;

    if (options != null) {
      id = options.id;
      unsafe = options.unsafe == true;
    }

    if (id != null) {
      for (let i = 0; i < constraints.length; i += 3) {
        if (constraints[i] === id) {
          constraints.splice(i, 3);
          break;
        }
      }
    }

    constraints.push(id, unsafe, constraint);

    const shape = this.clone();

    shape._constraints = constraints;
    shape._applyConstraints = createApplyConstraints(constraints);

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
  narrow<T extends O>(predicate: (output: O) => output is T, options?: NarrowingOptionsOrMessage): Shape<I, T>;

  /**
   * Adds a constraint that checks that value conforms the predicate.
   *
   * @param predicate The predicate that returns truthy result if value is valid, or returns falsy result otherwise.
   * @param options The constraint options or an issue message.
   * @returns The clone of this shape with the constraint added.
   * @template T The narrowed value.
   */
  narrow(predicate: (output: O) => boolean, options?: NarrowingOptionsOrMessage): this;

  narrow(predicate: (output: O) => boolean, options?: NarrowingOptionsOrMessage): this {
    return appendConstraint(
      this,
      options != null && typeof options === 'object' ? options.id : undefined,
      options,
      output => {
        if (!predicate(output)) {
          return createIssue(output, CODE_NARROWING, predicate, options, MESSAGE_NARROWING);
        }
      }
    );
  }

  /**
   * The shape input type guard.
   *
   * @returns `true` if an input can be parsed without errors, or `false` otherwise.
   * @throws Error if the shape doesn't support the synchronous parsing.
   */
  is(input: unknown): input is I {
    return !isValidationError(this.safeParse(input));
  }

  /**
   * Returns the shape clone.
   */
  clone(): this {
    return objectAssign(createObject(Object.getPrototypeOf(this)), this);
  }
}

const prototype = Shape.prototype;

const typingPropertyDescriptor: PropertyDescriptor = {
  get() {
    throwError('Cannot be used at runtime');
  },
};

defineProperty(prototype, 'input', typingPropertyDescriptor);

defineProperty(prototype, 'output', typingPropertyDescriptor);

function throwSynchronousParsingIsUnsupported(): never {
  throwError('Shape cannot be used in a synchronous context');
}

function returnValueOrThrow<T>(result: T | ValidationError): T {
  if (isValidationError(result)) {
    throw result;
  }
  return result;
}

function extractIssues(result: unknown): Issue[] | null {
  return isValidationError(result) ? result.issues : null;
}

/**
 * The shape that applies a transformer to the output of the base shape.
 *
 * @template I The base shape input value.
 * @template O The base shape output value.
 * @template T The transformed value.
 */
export class TransformedShape<I, O, T> extends Shape<I, T> {
  // Prevent Shape class type parameters from becoming invariant by using any here
  /**
   * The transformer callback.
   */
  protected _transformer: Transformer<any, any>;

  /**
   * Creates the new {@linkcode TransformedShape}.
   *
   * @param shape The base shape.
   * @param async If `true` then transformer must return a promise.
   * @param transformer The transformation callback.
   */
  constructor(protected shape: Shape<I, O>, async: boolean, transformer: Transformer<O, Promise<T> | T>) {
    super(shape.async || async);

    this._transformer = transformer;
  }

  safeParse(input: any, options?: ParserOptions): T | ValidationError {
    const { shape, _transformer, _applyConstraints } = this;

    let issues: Issue[] | null = null;
    let output;

    input = shape.safeParse(input, options);

    if (isValidationError(input)) {
      return input;
    }
    try {
      output = _transformer(input);
    } catch (error) {
      throwIfUnknownError(error);
      return error;
    }

    if (_applyConstraints !== null) {
      issues = _applyConstraints(output, options, issues);
    }

    return returnValueOrRaiseIssues(output, issues);
  }

  safeParseAsync(input: unknown, options?: ParserOptions): Promise<T | ValidationError> {
    if (!this.async) {
      return applySafeParseAsync(this, input, options);
    }

    const { shape, _transformer, _applyConstraints } = this;
    const promise = shape.parseAsync(input, options).then(_transformer);

    if (_applyConstraints !== null) {
      return promise.then(output => returnValueOrRaiseIssues(output, _applyConstraints(output, options, null)));
    }

    return promise.catch(returnError);
  }
}
