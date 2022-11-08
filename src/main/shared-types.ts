export interface Ok<T> {
  ok: true;

  /**
   * The output value.
   */
  value: T;
}

export interface Err {
  ok: false;

  /**
   * The list of issues encountered during parsing.
   */
  issues: Issue[];
}

/**
 * The result of shape application. This is the part of the internal API required for creating custom shapes.
 */
export type ApplyResult<T = any> = Ok<T> | Issue[] | null;

export type ApplyChecksCallback = (output: any, issues: Issue[] | null, options: ParseOptions) => Issue[] | null;

/**
 * A callback that takes a value and returns `undefined` if it satisfies the requirements. If a value doesn't satisfy
 * the check requirements then issues can be returned or a {@linkcode ValidationError} can be thrown.
 *
 * @type T The value type.
 */
export type CheckCallback<T = any> = (value: T) => Partial<Issue>[] | Partial<Issue> | null | undefined | void;

/**
 * The shape output value check.
 */
export interface Check {
  /**
   * The unique key of the check in scope of the shape.
   */
  key: unknown;

  /**
   * The callback that validates the shape output and returns the list of issues or throws a {@linkcode Validation} error.
   */
  callback: CheckCallback;

  /**
   * `true` if the {@linkcode callback} is invoked even if previous processors failed, or `false` otherwise.
   */
  unsafe: boolean;

  /**
   * The optional parameter used by the {@linkcode callback}.
   */
  param: any;
}

/**
 * Options that are applicable for the custom checks added via {@linkcode Shape.check}.
 */
export interface CheckOptions {
  /**
   * The unique key of the check in scope of the shape.
   */
  key?: unknown;

  /**
   * If `true` then the check would be executed even if the preceding check failed, otherwise check is
   * ignored.
   */
  unsafe?: boolean;

  /**
   * An optional param that would be associated with the checker and can be accessed at {@linkcode Shape.checks} using
   * {@linkcode Check.param}.
   */
  param?: any;
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
 * The message callback or a string.
 */
export type Message = ((param: any, value: any) => any) | string;

/**
 * Options that are applicable for the type constraint.
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
 * Options that are applicable for the built-in type-specific constraints.
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
   * If `true` then the constraint would be executed even if the preceding check failed, otherwise the constraint is
   * ignored.
   */
  unsafe?: boolean;
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
