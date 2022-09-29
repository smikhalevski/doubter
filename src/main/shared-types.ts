/**
 * Symbol that denotes an invalid value.
 */
export const INVALID: any = Symbol('invalid');

/**
 * A validation issue raised during input parsing.
 */
export interface Issue {
  /**
   * The unique code of the validation issue.
   */
  code: string;

  /**
   * The object path where an issue has occurred.
   */
  path: any[];

  /**
   * The value that caused an issue to occur.
   */
  input: any;

  /**
   * A message associated with an issue. Built-in messages are strings but custom messages can have an arbitrary type.
   */
  message: any;

  /**
   * An additional param that is specific for a particular {@linkcode code}.
   */
  param: any;

  /**
   * An arbitrary metadata that can be used for message formatting.
   */
  meta: any;
}

export type IssueLike = Partial<Issue>[] | Partial<Issue>;

/**
 * A callback that takes an input and returns `undefined` if value satisfies the constraint requirements. If values
 * doesn't satisfy the constraint requirements then a {@linkcode ValidationError} can be thrown, or detected issues can
 * be returned.
 */
export type Constraint<T> = (value: T, options: ParserOptions | undefined) => IssueLike | undefined | void;

/**
 * Transforms the value from one type to another. Transformer may throw or return a {@linkcode ValidationError} if there
 * are issues that prevent the value from being properly transformed.
 */
export type Transformer<I, O> = (value: I) => O;

/**
 * Options that are applicable for the type constraint.
 */
export interface InputConstraintOptions {
  /**
   * The custom issue message.
   */
  message?: any;

  /**
   * An arbitrary metadata that is added to an issue.
   */
  meta?: any;
}

/**
 * Options that follow in chain after the input constraint.
 */
export interface ChainableConstraintOptions {
  /**
   * If `true` then the constraint would be executed even if the preceding constraint failed, otherwise constraint is
   * ignored.
   */
  unsafe?: boolean;
}

/**
 * Options that are applicable for the built-in type-specific constraints.
 */
export interface OutputConstraintOptions extends InputConstraintOptions, ChainableConstraintOptions {}

/**
 * Options that are applicable for the custom constraints added via {@linkcode Shape.constraint}.
 */
export interface IdentifiableConstraintOptions extends ChainableConstraintOptions {
  /**
   * The unique ID of the constraint in scope of the shape.
   *
   * If there is a constraint with the same ID then it is replaced, otherwise it is appended to the list of constraints.
   * If the ID is `undefined` then the constraint is always appended to the list of constraints.
   */
  id?: string;
}

/**
 * Options for narrowing constraints that are added
 */
export interface NarrowingOptions extends OutputConstraintOptions, IdentifiableConstraintOptions {}

export type InputConstraintOptionsOrMessage = InputConstraintOptions | ((param: any, value: any) => any) | string;

export type OutputConstraintOptionsOrMessage = OutputConstraintOptions | ((param: any, value: any) => any) | string;

export type NarrowingOptionsOrMessage = NarrowingOptions | ((param: any, value: any) => any) | string;

/**
 * Options used by a shape to apply constraints and transformations.
 */
export interface ParserOptions {
  /**
   * If `true` then parsing all issues are collected during parsing, otherwise parsing is aborted after the first issue
   * is encountered.
   *
   * @default false
   */
  verbose?: boolean;
}

export type Tuple<T> = [T, ...T[]];

export type Primitive = string | number | bigint | boolean | null | undefined;

export interface Dict<T = any> {
  [key: string]: T;
}

/**
 * The closure that applies constraints to the input value and throws a validation error if
 * {@linkcode ParserOptions.fast fast} parsing is enabled, or returns an error otherwise.
 *
 * @param value The value to which constraints are applied.
 * @param options Parsing options.
 * @param issues The list of already captured issues.
 * @returns The list of captured issues, or `null` if there are no issues.
 */
export type ApplyConstraints = (
  value: any,
  options: ParserOptions | undefined,
  issues: Issue[] | null
) => Issue[] | null;
