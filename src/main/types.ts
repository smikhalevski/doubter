/**
 * Carries the result of successful input parsing.
 *
 * @template T The output value.
 */
export interface Ok<T> {
  ok: true;

  /**
   * The output value.
   */
  value: T;
}

/**
 * Carries the result of failed input parsing.
 */
export interface Err {
  ok: false;

  /**
   * The array of issues encountered during parsing.
   */
  issues: Issue[];
}

/**
 * A callback that takes a value and returns `undefined` if it satisfies the requirements. If a value doesn't satisfy
 * the check requirements then issues can be returned or a {@linkcode ValidationError} can be thrown.
 *
 * @param value The value that must be checked.
 * @param param The check param.
 * @template T The value that must be checked.
 * @template P The check param.
 * @throws {@linkcode ValidationError} to notify that the check cannot be completed.
 */
export type CheckCallback<T = any, P = any> = (
  value: T,
  param: P,
  options: Readonly<ApplyOptions>
) => Issue[] | Issue | null | undefined | void;

/**
 * The shape output value check.
 */
export interface Check {
  /**
   * The check key, unique in the scope of the shape.
   */
  readonly key: any;

  /**
   * The callback that validates the shape output and returns the array of issues or throws a
   * {@linkcode ValidationError}.
   */
  readonly callback: CheckCallback;

  /**
   * The optional parameter used by the {@linkcode callback}.
   */
  readonly param: any;

  /**
   * `true` if the {@linkcode callback} is invoked even if previous processors failed, or `false` otherwise.
   */
  readonly isUnsafe: boolean;
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
   * The param passed to the {@linkcode CheckCallback} and stored in {@linkcode Check.param}.
   */
  param?: any;

  /**
   * If `true` then the check would be executed even if the preceding check failed, otherwise check is
   * ignored.
   */
  unsafe?: boolean;
}

/**
 * A validation issue raised during input parsing.
 */
export interface Issue {
  /**
   * The code of the validation issue.
   */
  code?: any;

  /**
   * The object path where an issue has occurred, or `undefined` if the issue is caused by the {@linkcode input}.
   */
  path?: any[];

  /**
   * The value that caused an issue to occur.
   */
  input?: any;

  /**
   * A message associated with an issue. Built-in messages are strings but custom messages can have an arbitrary type.
   */
  message?: any;

  /**
   * An additional param.
   */
  param?: any;

  /**
   * An arbitrary metadata associated with this issue.
   */
  meta?: any;
}

/**
 * The message callback or a string.
 *
 * @param param The check param or `undefined` if there's no param.
 * @param code The issue code.
 * @param input The input value that the shape was trying to parse.
 * @param meta The metadata passed as a check option during shape declaration.
 * @param options The parsing options.
 * @returns Any value that should be used as an issue message.
 */
export type MessageCallback = (param: any, code: any, input: any, meta: any, options: Readonly<ApplyOptions>) => any;

/**
 * A callback that returns an issue message or a message string.
 */
export type Message = MessageCallback | string;

/**
 * Options that are applicable for the built-in type-specific constraints.
 */
export interface ConstraintOptions {
  /**
   * The custom issue message.
   */
  message?: Message | Literal;

  /**
   * An arbitrary metadata that is added to an issue.
   */
  meta?: any;
}

export interface RefineOptions extends ConstraintOptions {
  /**
   * The unique key of the check in scope of the shape.
   */
  key?: unknown;

  /**
   * The custom issue code. By default, an issue is raised with a "predicate" code.
   */
  code?: any;

  /**
   * If `true` then the predicate would be executed even if the preceding check failed, otherwise the predicate is
   * ignored.
   */
  unsafe?: boolean;
}

/**
 * Options used during parsing.
 */
export interface ApplyOptions {
  /**
   * If `true` then all issues are collected during parsing, otherwise parsing is aborted after the first issue is
   * encountered.
   *
   * @default false
   */
  verbose?: boolean;

  /**
   * If `true` then all shapes would try to coerce input to a required type.
   *
   * @default false
   */
  coerced?: boolean;

  /**
   * The custom context.
   */
  context?: any;
}

/**
 * Options used during parsing.
 */
export interface ParseOptions extends ApplyOptions {
  /**
   * A message that is passed to {@linkcode ValidationError} if it is thrown.
   */
  errorMessage?: ((issues: Issue[], input: any) => string) | string;
}

/**
 * The literal value of any type.
 */
export type Literal = object | string | number | bigint | boolean | symbol | null | undefined;
