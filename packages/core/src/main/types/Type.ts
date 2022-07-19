import { ParserContext } from '../ParserContext';
import { Awaitable, Issue, RaiseIssue } from '../shared-types';
import { ValidationError } from '../ValidationError';

/**
 * Infers the type from the type definition.
 */
export type InferType<X extends Type> = X extends Type<infer T> ? T : never;

/**
 * The transformer that converts the input input to the output type.
 *
 * @param input The input input that must be transformed.
 * @param raiseIssue The callback that raises a validation issue to notify the parser that input cannot be
 * transformed.
 */
export type Transformer<I, O> = (value: I, raiseIssue: RaiseIssue) => O;

/**
 * The abstract type definition.
 *
 * @template T The type of the parsed input.
 */
export abstract class Type<T = any> {
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
   * Clones the type instance.
   */
  clone(): this {
    return Object.assign(new (this.constructor as new () => this)(), this);
  }

  /**
   * Returns `true` if parsing is async, or `false` otherwise.
   *
   * With async types you should use {@link parseAsync} and {@link validateAsync}.
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
  transform<O>(transformer: Transformer<T, O>): TransformedType<T, O> {
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
  transformAsync<O>(transformer: Transformer<T, Promise<O>>): TransformedType<T, O> {
    return new TransformedType(this, true, transformer);
  }

  /**
   * Validates the input and returns the list of issues.
   *
   * @param input The input to validate.
   * @returns The list of issues encountered during validation.
   *
   * @throws Error if the type {@link isAsync}.
   */
  validate(input: unknown): Issue[] {
    if (this.isAsync()) {
      throw new Error('Cannot use async type as sync');
    }

    const context = new ParserContext(false);
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
    const context = new ParserContext(false);
    return Promise.resolve(this._parse(input, context)).then(() => context.issues);
  }

  /**
   * Narrowing type predicate that checks that the input conforms the type.
   *
   * @param input The input to check.
   * @returns `true` if input conforms the type, or `false` otherwise.
   *
   * @throws Error if the type {@link isAsync}.
   */
  is(input: unknown): input is T {
    if (this.isAsync()) {
      throw new Error('Cannot use async type as sync');
    }

    const context = new ParserContext(true);
    this._parse(input, context);

    return context.valid;
  }

  /**
   * Parses the input, so it conforms the type.
   *
   * @param input The input to parse.
   * @returns `true` if input conforms the type, or `false` otherwise.
   *
   * @throws Error if the type {@link isAsync}.
   * @throws {@link ValidationError} if encountered issues during parsing.
   */
  parse(input: unknown): T {
    if (this.isAsync()) {
      throw new Error('Cannot use async type as sync');
    }

    const context = new ParserContext(true);
    const result = this._parse(input, context);

    if (context.valid) {
      return result;
    }
    throw new ValidationError(context.issues);
  }

  /**
   * Asynchronously parses the input, so it conforms the type.
   *
   * @param input The input to parse.
   * @returns `true` if input conforms the type, or `false` otherwise.
   *
   * @throws {@link ValidationError} if encountered issues during parsing.
   */
  parseAsync(input: unknown): Promise<T> {
    const context = new ParserContext(true);

    return Promise.resolve(this._parse(input, context)).then(value => {
      if (context.valid) {
        return value;
      }
      throw new ValidationError(context.issues);
    });
  }
}

export class TransformedType<I, O> extends Type<O> {
  constructor(private _type: Type<I>, private _async: boolean, private _transformer: Transformer<I, Awaitable<O>>) {
    super();
  }

  isAsync(): boolean {
    return this._async || this._type.isAsync();
  }

  _parse(input: unknown, context: ParserContext): any {
    const { _type, _transformer } = this;
    const { raiseIssue } = context;

    const result = _type._parse(input, context);

    if (this.isAsync()) {
      return Promise.resolve(result).then(result => (context.aborted ? _transformer(result, raiseIssue) : input));
    }
    return context.aborted ? _transformer(result, raiseIssue) : input;
  }
}
