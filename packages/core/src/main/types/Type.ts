import { ParserContext } from '../ParserContext';
import { Awaitable, Issue, Predicate, Transformer } from '../shared-types';
import { ValidationError } from '../ValidationError';

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
  abstract _parse(value: any, context: ParserContext): any;

  /**
   * Returns `true` if {@link _parse} returns a `Promise`, or `false` otherwise.
   *
   * @internal
   */
  protected _isAsync(): boolean {
    return false;
  }

  protected _clone(): this {
    return Object.assign(new (this.constructor as new () => this)(), this);
  }

  /**
   * `true` if the type parsing is async, or `false` otherwise.
   */
  get async(): boolean {
    const async = this._isAsync();
    Object.defineProperty(this, 'async', { value: async });
    return async;
  }

  /**
   * Marks the type as optional.
   *
   * @param defaultValue The default value that should be used if value is `undefined`.
   * @returns The optional type.
   */
  optional(defaultValue?: T): OptionalType<T> {
    return new OptionalType(this, defaultValue);
  }

  nullable(): NullableType<T> {
    return new NullableType(this);
  }

  nullish(defaultValue?: T | null): OptionalType<T | null> {
    return this.nullable().optional(defaultValue);
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

  // /**
  //  * Narrows the type of the value using the type predicate, or raises an issue if the value doesn't conform the
  //  * predicate.
  //  *
  //  * @param predicate The type predicate.
  //  * @param meta The meta that is added to the raised issue.
  //  * @return The transformed type.
  //  *
  //  * @template O The type of the narrowed value.
  //  */
  // refine<O extends T>(predicate: TypePredicate<T, O>, meta?: any): Type<O>;
  //
  // /**
  //  * Asserts that the value conforms the predicate, and raises an issue if it doesn't.
  //  *
  //  * @param predicate The type predicate.
  //  * @param meta The meta that is added to the raised issue.
  //  * @return The transformed type.
  //  */
  // refine(predicate: Predicate<T>, meta?: any): Type<T>;
  //
  // refine(predicate: Predicate<T>, meta?: any): Type {
  //   return this.transform((value, raiseIssue) => {
  //     if (!predicate(value)) {
  //       raiseIssue('invalid_type', 'Must conform the predicate', meta);
  //     }
  //     return value;
  //   });
  // }

  /**
   * Asserts that value conforms the type if the condition is met.
   *
   * @param predicate The condition that value must meet for `thenType` to be applied.
   * @param thenType The type that is applied if condition is met.
   * @param elseType The type that is applied if condition isn't met.
   * @returns The conditional type.
   */
  if(predicate: Predicate<T>, thenType: Type, elseType?: Type): IfType<T> {
    return new IfType(this, predicate, thenType, elseType);
  }

  /**
   * Validates the value and returns the list of issues.
   *
   * @param value The value to validate.
   * @returns The list of issues encountered during validation.
   *
   * @throws Error if the type is {@link async}.
   */
  validate(value: unknown): Issue[] {
    if (this.async) {
      throw new Error('Cannot use async type');
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
   * @throws Error if the type is {@link async}.
   */
  is(value: unknown): value is T {
    if (this.async) {
      throw new Error('Cannot use async type');
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
   * @throws Error if the type is {@link async}.
   * @throws {@link ValidationError} if encountered issues during parsing.
   */
  parse(value: unknown): T {
    if (this.async) {
      throw new Error('Cannot use async type');
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

export class OptionalType<T> extends Type<T | undefined> {
  constructor(private _type: Type<T>, private _defaultValue?: T) {
    super();
  }

  protected _isAsync() {
    return this._type.async;
  }

  _parse(value: any, context: ParserContext): any {
    const { _type, _defaultValue } = this;

    if (value === undefined) {
      return this.async ? Promise.resolve(_defaultValue) : _defaultValue;
    } else {
      return _type._parse(value, context);
    }
  }
}

export class NullableType<T> extends Type<T | null> {
  constructor(private _type: Type<T>) {
    super();
  }

  protected _isAsync() {
    return this._type.async;
  }

  _parse(value: any, context: ParserContext): any {
    const { _type } = this;

    if (value === null) {
      return this.async ? Promise.resolve(value) : value;
    } else {
      return _type._parse(value, context);
    }
  }
}

export class TransformedType<I, O> extends Type<O> {
  constructor(
    private _type: Type<I>,
    private _transformerAsync: boolean,
    private _transformer: Transformer<I, Awaitable<O>>
  ) {
    super();
  }

  protected _isAsync(): boolean {
    return this._transformerAsync || this._type.async;
  }

  _parse(value: any, context: ParserContext): any {
    const { _type, _transformer } = this;
    const { raiseIssue } = context;

    const result = _type._parse(value, context);

    if (this.async) {
      return Promise.resolve(result).then(result => (context.aborted ? _transformer(result, raiseIssue) : value));
    }
    return context.aborted ? _transformer(result, raiseIssue) : value;
  }
}

class IfType<T> extends Type<T> {
  constructor(
    private _type: Type<T>,
    private _predicate: Predicate<T>,
    private _thenType: Type,
    private _elseType: Type | null = null
  ) {
    super();
  }

  protected _isAsync(): boolean {
    return this._type.async || this._elseType?.async || this._thenType.async;
  }

  _parse(value: any, context: ParserContext): any {
    const { _predicate, _thenType, _elseType } = this;

    const result = this._type._parse(value, context);

    if (this.async) {
      return Promise.resolve(result).then(result => {
        if (!context.valid) {
          return value;
        }
        if (_predicate(result)) {
          return _thenType._parse(result, context);
        }
        if (_elseType !== null) {
          return _elseType._parse(result, context);
        }
        return result;
      });
    }
    if (!context.valid) {
      return value;
    }
    if (_predicate(result)) {
      return _thenType._parse(result, context);
    }
    if (_elseType !== null) {
      return _elseType._parse(result, context);
    }
    return result;
  }
}
