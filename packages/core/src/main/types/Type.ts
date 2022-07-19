import { ParserContext } from '../ParserContext';
import { Awaitable, Issue, RaiseIssue } from '../shared-types';
import { ValidationError } from '../ValidationError';

/**
 * Infers the type from the type definition.
 */
export type InferType<X extends Type> = X extends Type<infer T> ? T : never;

/**
 * The transformer that converts the input value to the output type.
 *
 * @param value The input value that must be transformed.
 * @param raiseIssue The callback that raises a validation issue to notify the parser that value cannot be
 * transformed.
 */
export type Transformer<I, O> = (value: I, raiseIssue: RaiseIssue) => O;

/**
 * The abstract type definition.
 *
 * @template T The type of the parsed value.
 */
export abstract class Type<T = any> {
  /**
   * Parses the value so it conforms the type. If value cannot be parsed then it is returned as is. To indicate that
   * the value is invalid call {@link ParserContext.raiseIssue}.
   *
   * This method is the part of the internal parsing flow. Use {@link parse} and {@link parseAsync} instead.
   *
   * @param value The value to parse.
   * @param context The context of the parser.
   * @returns The parsed value.
   *
   * @internal
   */
  abstract _parse(value: unknown, context: ParserContext): any;

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
   * Transforms the value to the new type.
   *
   * @param transformer The callback that takes the value and transforms it to the new type.
   * @return The transformed type.
   *
   * @template O The type of the output value.
   */
  transform<O>(transformer: Transformer<T, O>): TransformedType<T, O> {
    return new TransformedType(this, false, transformer);
  }

  /**
   * Asynchronously transforms the value to the new type.
   *
   * @param transformer The callback that takes the value and transforms it to the new type.
   * @return The transformed type.
   *
   * @template O The type of the output value.
   */
  transformAsync<O>(transformer: Transformer<T, Promise<O>>): TransformedType<T, O> {
    return new TransformedType(this, true, transformer);
  }

  /**
   * Validates the value and returns the list of issues.
   *
   * @param value The value to validate.
   * @returns The list of issues encountered during validation.
   *
   * @throws Error if the type {@link isAsync}.
   */
  validate(value: unknown): Issue[] {
    if (this.isAsync()) {
      throw new Error('Cannot use async type as sync');
    }

    const context = new ParserContext(false);
    this._parse(value, context);
    return context.issues;
  }

  /**
   * Asynchronously validates the value and returns the list of issues.
   *
   * @param value The value to validate.
   * @returns The list of issues encountered during validation.
   */
  validateAsync(value: unknown): Promise<Issue[]> {
    const context = new ParserContext(false);
    return Promise.resolve(this._parse(value, context)).then(() => context.issues);
  }

  /**
   * Narrowing type predicate that checks that the value conforms the type.
   *
   * @param value The value to check.
   * @returns `true` if value conforms the type, or `false` otherwise.
   *
   * @throws Error if the type {@link isAsync}.
   */
  is(value: unknown): value is T {
    if (this.isAsync()) {
      throw new Error('Cannot use async type as sync');
    }

    const context = new ParserContext(true);
    this._parse(value, context);

    return context.valid;
  }

  /**
   * Parses the value, so it conforms the type.
   *
   * @param value The value to parse.
   * @returns `true` if value conforms the type, or `false` otherwise.
   *
   * @throws Error if the type {@link isAsync}.
   * @throws {@link ValidationError} if encountered issues during parsing.
   */
  parse(value: unknown): T {
    if (this.isAsync()) {
      throw new Error('Cannot use async type as sync');
    }

    const context = new ParserContext(true);
    const result = this._parse(value, context);

    if (context.valid) {
      return result;
    }
    throw new ValidationError(context.issues);
  }

  /**
   * Asynchronously parses the value, so it conforms the type.
   *
   * @param value The value to parse.
   * @returns `true` if value conforms the type, or `false` otherwise.
   *
   * @throws {@link ValidationError} if encountered issues during parsing.
   */
  parseAsync(value: unknown): Promise<T> {
    const context = new ParserContext(true);

    return Promise.resolve(this._parse(value, context)).then(value => {
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

  _parse(value: unknown, context: ParserContext): any {
    const { _type, _transformer } = this;
    const { raiseIssue } = context;

    const result = _type._parse(value, context);

    if (this.isAsync()) {
      return Promise.resolve(result).then(result => (context.aborted ? _transformer(result, raiseIssue) : value));
    }
    return context.aborted ? _transformer(result, raiseIssue) : value;
  }
}
