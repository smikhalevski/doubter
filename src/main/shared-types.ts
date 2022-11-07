export interface Ok<T> {
  ok: true;
  value: T;
}

export interface Err {
  ok: false;
  issues: Issue[];
}

export type ApplyResult<T = any> = Ok<T> | Issue[] | null;

export interface Check {
  /**
   * The unique key of the check in scope of the shape.
   */
  key: string | undefined;

  /**
   * The callback that validates the shape output and returns the list of issues or throws a {@linkcode Validation} error.
   */
  checker: Checker;

  /**
   * `true` if the check callback is invoked even if previous checks have failed.
   */
  unsafe: boolean;

  /**
   * The optional parameter used by the callback.
   */
  param: any;
}

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
export type Checker<T = any> = (value: T) => Issue[] | Issue | null | undefined | void;

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
   * The unique key of the check in scope of the shape.
   *
   * If there is a check with the same key then it is replaced, otherwise it is appended to the list of checks.
   * If the key is `undefined` then the check is always appended to the list of checks.
   */
  key?: string;

  /**
   * If `true` then the check would be executed even if the preceding check failed, otherwise check is
   * ignored.
   */
  unsafe?: boolean;

  /**
   * An optional param that would be associated with the checker and can be accessed at {@linkcode Shape.checks} using
   * {@linkcode Check.param}. This can be used for shape introspection.
   */
  param?: any;
}

/**
 * Options for type narrowing checks.
 */
export interface RefineOptions extends ConstraintOptions, CheckOptions {}

/**
 * Options applied during parsing.
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

export type Any = object | string | number | bigint | boolean | null | undefined;

export interface Dict<T = any> {
  [key: string]: T;
}
