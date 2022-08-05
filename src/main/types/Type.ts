import { Awaitable, ConstraintOptions, Issue, ParserOptions } from '../shared-types';
import { extractIssues, parseAsync, raiseIssue, returnNull } from '../utils';

/**
 * Infers the type from the type definition.
 *
 * @template X The type definition to infer the type from.
 */
export type InferType<X extends AnyType> = X extends Type<infer T> ? T : never;

/**
 * An arbitrary type definition.
 */
export type AnyType = Type<any> | Type<never>;

/**
 * The abstract type definition.
 */
export abstract class Type<T> {
  constructor(readonly async: boolean, protected options?: ConstraintOptions) {}

  /**
   * Parses the input so it conforms the type definition.
   *
   * @param input The input to parse.
   * @param options The parser options.
   * @returns The parsed value.
   * @throws {@link ValidationError} if parsing has failed.
   */
  abstract parse(input: unknown, options?: ParserOptions): Awaitable<T>;

  at(key: unknown): AnyType | null {
    return null;
  }

  validate(input: unknown, options?: ParserOptions): Issue[] | null {
    if (this.async) {
      throw new Error('Cannot use async type');
    }
    try {
      this.parse(input, options);
    } catch (error) {
      return extractIssues(error);
    }
    return null;
  }

  validateAsync(input: unknown, options?: ParserOptions): Promise<Issue[] | null> {
    return parseAsync(this, input, options).then(returnNull, extractIssues);
  }

  /**
   * Transforms the input to the new type.
   *
   * @param transformer The callback that takes the input and transforms it to the new type.
   * @returns The transformed type.
   *
   * @template O The type of the output input.
   */
  transform<O>(transformer: Transformer<T, O>): TransformedType<this, O> {
    return new TransformedType(this, false, transformer);
  }

  /**
   * Asynchronously transforms the input to the new type.
   *
   * @param transformer The callback that takes the input and transforms it to the new type.
   * @returns The transformed type.
   *
   * @template O The type of the output input.
   */
  transformAsync<O>(transformer: Transformer<T, Promise<O>>): TransformedType<this, O> {
    return new TransformedType(this, true, transformer);
  }

  narrow<O extends T>(predicate: (value: T) => value is O, options?: ConstraintOptions): TransformedType<this, O>;

  narrow(predicate: (value: T) => unknown, options?: ConstraintOptions): TransformedType<this, T>;

  narrow(predicate: (value: T) => unknown, options?: ConstraintOptions): TransformedType<this, T> {
    return this.transform(input => {
      if (!predicate(input)) {
        raiseIssue(input, 'narrow', undefined, options, 'Must be narrowed');
      }
      return input;
    });
  }
}

/**
 * Transforms the input value to the output value.
 *
 * @param input The input value that must be transformed.
 * @returns The output value.
 *
 * @template I The type of the input value.
 * @template O The type of the output input.
 */
export type Transformer<I, O> = (input: I) => O;

/**
 * The transforming type definition.
 *
 * @template X The type definition of the input value.
 * @template T The output value.
 */
export class TransformedType<X extends AnyType, O> extends Type<O> {
  /**
   * Creates a new {@link TransformedType} instance.
   *
   * @param type The type that parses a transformation input value.
   * @param async `true` if transformer returns a `Promise`, or `false` otherwise.
   * @param transformer The transformer that converts input value to the output value.
   */
  constructor(protected type: X, async: boolean, protected transformer: Transformer<InferType<X>, Awaitable<O>>) {
    super(async || type.async);
  }

  parse(input: unknown, options?: ParserOptions): Awaitable<O> {
    const { type, transformer } = this;

    if (this.async) {
      const promise = type.async ? type.parse(input, options) : parseAsync(type, input, options);

      return promise.then(transformer);
    }

    return transformer(type.parse(input, options));
  }
}
