export interface Ok<T> {
  ok: true;
  value: T;
}

export interface Err {
  ok: false;
  issues: Issue[];
}

export type ApplyResult<T = any> = Ok<T> | Issue[] | null;

/**
 * A validation issue raised during input parsing.
 */
export interface Issue {
  /**
   * The unique code of the validation issue.
   */
  code: any;

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
 * A callback that takes an input and returns `undefined` if value satisfies the check requirements. If values
 * doesn't satisfy the check requirements then a {@linkcode ValidationError} can be thrown, or detected issues can
 * be returned.
 */
export type CheckCallback<T> = (value: T) => Issue[] | Issue | null | undefined | void;

/**
 * The message callback or a string.
 */
export type Message = ((param: any, value: any) => any) | string;

/**
 * Options that are applicable for the type check.
 */
export interface TypeConstraintOptions {
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
 * Options that are applicable for the built-in type-specific checks.
 */
export interface ConstraintOptions {
  /**
   * The custom issue message.
   */
  message?: any;

  /**
   * An arbitrary metadata that is added to an issue.
   */
  meta?: any;

  /**
   * If `true` then the check would be executed even if the preceding check failed, otherwise check is
   * ignored.
   */
  unsafe?: boolean;
}

/**
 * Options that are applicable for the custom checks added via {@linkcode Shape.check}.
 */
export interface CheckOptions {
  /**
   * The unique ID of the check in scope of the shape.
   *
   * If there is a check with the same ID then it is replaced, otherwise it is appended to the list of checks.
   * If the ID is `undefined` then the check is always appended to the list of checks.
   */
  id?: string;

  /**
   * If `true` then the check would be executed even if the preceding check failed, otherwise check is
   * ignored.
   */
  unsafe?: boolean;
}

/**
 * Options for narrowing checks that are added
 */
export interface RefineOptions extends ConstraintOptions, CheckOptions {}

/**
 * Options used by a shape to apply checks and transformations.
 */
export interface ParseOptions {
  /**
   * If `true` then all issues are collected during parsing, otherwise parsing is aborted after the first issue is
   * encountered.
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
