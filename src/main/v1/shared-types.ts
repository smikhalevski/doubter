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

/**
 * Transforms the value from one type to another. Transformer may throw a {@linkcode ValidationError} if there are
 * issues that prevent the value from being properly transformed.
 */
export type Transformer<I, O> = (value: I) => O;

/**
 * Constraint is a callback that takes an input and throws a {@linkcode ValidationError} if it has recognised issues.
 */
export type Constraint<T> = (value: T) => Issue[] | null | undefined | void;

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
 * Options that are applicable for the built-in type-specific constraints.
 */
export interface OutputConstraintOptions extends InputConstraintOptions, ChainableConstraintOptions {}

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
 * Options that are applicable for the custom constraints added via {@linkcode Shape.constrain}.
 */
export interface IdentifiableConstraintOptions extends ChainableConstraintOptions {
  /**
   * The unique ID of the constraint in scope of the shape.
   *
   * If there is a constraint with the same ID then it is replaced, otherwise it is appended to the list of constraints.
   * If the ID is `null` then the constraint is always appended to the list of constraints.
   */
  id?: string | null;
}

/**
 * Options for narrowing constraints that are added
 */
export interface NarrowingConstraintOptions extends OutputConstraintOptions, IdentifiableConstraintOptions {}

/**
 * Options used by a shape to apply constraints and transformations.
 */
export interface ParserOptions {
  /**
   * If `true` then parsing should end as soon as the first issue is captured, otherwise maximum number of issues should
   * be collected before parsing is terminated.
   *
   * @default false
   */
  fast?: boolean;
}

export type Multiple<T> = [T, ...T[]];

export type Primitive = string | number | bigint | boolean | null | undefined;

export interface Dict<T = any> {
  [key: string]: T;
}

/**
 * The closure that applies constraints to the input value and throws a validation error if
 * {@linkcode ParserOptions.fast fast} parsing is enabled, or returns an error otherwise.
 *
 * @param input The value to parse.
 * @param options Parsing options.
 * @param issues The list of already captured issues.
 * @returns The list of captured issues, or `null` if there are no issues.
 */
export type ApplyConstraints<T> = (
  input: T,
  options: ParserOptions | undefined,
  issues: Issue[] | null
) => Issue[] | null;
