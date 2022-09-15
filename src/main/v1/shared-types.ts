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
   * An additional param that is specific for a particular {@link code}.
   */
  param: any;

  /**
   * An arbitrary metadata that can be used for message formatting.
   */
  meta: any;
}

/**
 * Transforms the value from one type to another. Transformer may throw a {@link ValidationError} if there are issues
 * that prevent the value from being properly transformed.
 */
export type Transformer<I, O> = (value: I) => O;

/**
 * Constraint is a callback that takes an input and throws a {@link ValidationError} if it has recognised issues.
 */
export type Constraint<T> = (value: T) => void;

/**
 * The set of options that are applicable for the type constraints.
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
 * The set of options that are applicable for the build-in type-specific constraints.
 */
export interface OutputConstraintOptions extends InputConstraintOptions {
  /**
   * If `true` then the constraint would be executed even if the preceding constraint failed, otherwise constraint is
   * ignored.
   */
  unsafe?: boolean;
}

/**
 * The set of options that are applicable for the custom constraints.
 */
export interface CustomConstraintOptions {
  /**
   * The name that would uniquely identify the constraint in scope of the shape.
   *
   * If there is a constraint with the same name then it is replaced, otherwise it is appended to the list of
   * constraints. If the name is `null` then the constraint is always appended to the list of constraints.
   */
  name?: string;

  /**
   * If `true` then the constraint would be executed even if the preceding constraint failed, otherwise constraint is
   * ignored.
   */
  unsafe?: boolean;
}

export interface NarrowingConstraintOptions extends OutputConstraintOptions, CustomConstraintOptions {}

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
