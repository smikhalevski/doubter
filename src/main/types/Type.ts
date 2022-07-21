import { ParserContext } from '../ParserContext';
import { Issue } from '../shared-types';
import { ValidationError } from '../ValidationError';
import { createIssue, toPromise } from '../utils';

/**
 * Infers the type from the type definition.
 *
 * @template X The type definition to infer the data type from.
 */
export type InferType<X extends AnyType> = X extends Type<infer T> ? T : never;

/**
 * Transforms the input value to the output value.
 *
 * @param input The input value that must be transformed.
 * @param raiseIssue The callback that raises a validation issue to notify the parser that input cannot be
 * properly transformed.
 * @returns The output value.
 *
 * @template I The type of the input value.
 * @template O The type of the output input.
 */
export type Transformer<I, O> = (input: I, context: ParserContext) => O;

export type AnyType = Type<any> | Type<never>;

/**
 * The abstract type definition.
 *
 * @template T The type of the value represented by the type definition.
 */
export abstract class Type<T> {
  /**
   * Parses the input so it conforms the type. If input cannot be parsed then it is returned as is. To indicate that
   * the input is invalid call {@link ParserContext.raiseIssue}.
   *
   * This method is the part of the internal parsing flow. Use {@link parse} and {@link parseAsync} instead.
   *
   * @param input The input to parse.
   * @param context The context of the parser.
   * @returns The parsed input.
   *
   * @internal
   */
  abstract _parse(input: unknown, context: ParserContext): any;

  /**
   * Returns `true` if parsing is async, or `false` otherwise.
   *
   * Use {@link parseAsync} and {@link validateAsync} with async type definitions.
   */
  isAsync(): boolean {
    return false;
  }

  /**
   * Transforms the input to the new type.
   *
   * @param transformer The callback that takes the input and transforms it to the new type.
   * @return The transformed type.
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
   * @return The transformed type.
   *
   * @template O The type of the output input.
   */
  transformAsync<O>(transformer: Transformer<T, Promise<O>>): TransformedType<this, O> {
    return new TransformedType(this, true, transformer);
  }

  refine<O extends T>(refiner: (input: T) => input is O, code?: string): TransformedType<this, O>;

  refine(refiner: (input: T) => boolean, code?: string): TransformedType<this, T>;

  refine(refiner: (input: T) => boolean, code = 'refinement'): TransformedType<this, T> {
    return new TransformedType(this, false, (input, context) => {
      if (!refiner(input)) {
        context.raiseIssue(createIssue(context, code, input));
      }
      return input;
    });
  }

  /**
   * Validates the input and returns the list of issues.
   *
   * @param input The input to validate.
   * @returns The list of issues encountered during validation.
   *
   * @throws Error if the type is async.
   */
  validate(input: unknown): Issue[] {
    if (this.isAsync()) {
      throw new Error('Cannot use async type as sync');
    }

    const context = ParserContext.create();
    this._parse(input, context);
    return context.issues;
  }

  /**
   * Asynchronously validates the input and returns the list of issues.
   *
   * @param input The input to validate.
   * @returns The list of issues encountered during validation.
   */
  validateAsync(input: unknown): Promise<Issue[]> {
    const context = ParserContext.create();
    return toPromise(this._parse(input, context)).then(() => context.issues);
  }

  /**
   * Narrowing type predicate that checks that the input conforms the type.
   *
   * @param input The input to check.
   * @returns `true` if input conforms the type, or `false` otherwise.
   *
   * @throws Error if the type is async.
   */
  is(input: unknown): input is T {
    if (this.isAsync()) {
      throw new Error('Cannot use async type as sync');
    }

    const context = ParserContext.create(true);
    this._parse(input, context);

    return context.valid;
  }

  /**
   * Parses the input, so it conforms the type.
   *
   * @param input The input to parse.
   * @param quick If `true` then parsing is aborted as soon as the first issue is detected.
   * @returns `true` if input conforms the type, or `false` otherwise.
   *
   * @throws Error if the type is async.
   * @throws {@link ValidationError} if encountered issues during parsing.
   */
  parse(input: unknown, quick = true): T {
    if (this.isAsync()) {
      throw new Error('Cannot use async type as sync');
    }

    const context = ParserContext.create(quick);
    const output = this._parse(input, context);

    if (context.valid) {
      return output;
    }
    throw new ValidationError(context.issues);
  }

  /**
   * Asynchronously parses the input, so it conforms the type.
   *
   * @param input The input to parse.
   * @param quick If `true` then parsing is aborted as soon as the first issue is detected.
   * @returns `true` if input conforms the type, or `false` otherwise.
   *
   * @throws {@link ValidationError} if encountered issues during parsing.
   */
  parseAsync(input: unknown, quick = true): Promise<T> {
    const context = ParserContext.create(quick);

    return toPromise(this._parse(input, context)).then(value => {
      if (context.valid) {
        return value;
      }
      throw new ValidationError(context.issues);
    });
  }
}

/**
 * The transforming type definition.
 *
 * @template X The type definition of the input value.
 * @template T The output value.
 */
export class TransformedType<X extends AnyType, T> extends Type<T> {
  /**
   * Creates a new {@link TransformedType} instance.
   *
   * @param _type The type that parses a transformation input value.
   * @param _async `true` if transformer returns a `Promise`, or `false` otherwise.
   * @param _transformer The transformer that converts input value to the output value.
   */
  constructor(
    private _type: X,
    private _async: boolean,
    private _transformer: Transformer<InferType<X>, Promise<T> | T>
  ) {
    super();
  }

  isAsync(): boolean {
    return this._async || this._type.isAsync();
  }

  _parse(input: unknown, context: ParserContext): any {
    const { _type, _transformer } = this;

    const output = _type._parse(input, context);

    if (this.isAsync()) {
      return toPromise(output).then(output => (context.aborted ? _transformer(output, context) : input));
    }
    return context.aborted ? _transformer(output, context) : input;
  }
}
