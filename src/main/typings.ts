/**
 * A result returned from a shape after it was applied to an input value.
 *
 * - If `null` then the input value is valid and wasn't transformed.
 * - If an {@link Ok} instance then the input value is valid and was transformed.
 * - If an array of {@link Issue issues} then the input value is invalid.
 *
 * @template Value The output value.
 * @see {@link Shape._apply}
 * @see {@link Shape._applyAsync}
 * @group Other
 */
export type Result<Value = any> = Ok<Value> | Issue[] | null;

/**
 * Carries the result of a successful input parsing.
 *
 * @template Value The output value.
 * @group Other
 */
export interface Ok<Value = any> {
  ok: true;

  /**
   * The output value.
   */
  value: Value;
}

/**
 * Carries the result of a failed input parsing.
 *
 * @group Other
 */
export interface Err {
  ok: false;

  /**
   * The array of issues encountered during parsing.
   */
  issues: Issue[];
}

/**
 * A validation issue raised during input parsing.
 *
 * @group Issues
 */
export interface Issue {
  /**
   * A code of the validation issue, which uniquely identifies the reason of an issue.
   *
   * For all built-in shape operations, a code can be used to infer the type of the {@link Issue.param}.
   *
   * @see [Validation errors](https://github.com/smikhalevski/doubter#validation-errors)
   */
  code?: any;

  /**
   * An object path to {@link Issue.input} value starting from the parsed object. Both an empty array and `undefined`
   * mean that an issue is caused by the {@link Issue.input} value itself.
   *
   * @example ['users', 0, 'age']
   * @see {@link Shape.at}
   */
  path?: any[];

  /**
   * The input value that caused a validation issue. Note that if coercion or alteration were applied then this contains
   * a transformed value.
   *
   * @see [Type coercion](https://github.com/smikhalevski/doubter#type-coercion)
   */
  input?: any;

  /**
   * The human-readable issue message.
   *
   * Messages produced by built-in operations are strings but custom messages can have an arbitrary type.
   *
   * @see [Localization](https://github.com/smikhalevski/doubter#localization)
   */
  message?: any;

  /**
   * The parameter value associated with the issue.
   *
   * @see [Validation errors](https://github.com/smikhalevski/doubter#validation-errors)
   */
  param?: any;

  /**
   * The optional metadata associated with the issue.
   *
   * @see [Metadata](https://github.com/smikhalevski/doubter#metadata)
   */
  meta?: any;
}

/**
 * Options used by shapes and built-in operations to create an issue.
 *
 * @see {@link Issue}
 * @group Issues
 */
export interface IssueOptions {
  /**
   * The custom issue message.
   *
   * @see {@link Message}
   * @see {@link Issue.message}
   */
  message?: Message | Any;

  /**
   * An arbitrary metadata that is added to an issue.
   *
   * @see {@link Issue.meta}
   */
  meta?: any;
}

/**
 * A callback that returns an issue message, or an issue message string.
 *
 * `%s` placeholder in string messages is replaced with the {@link Issue.param}.
 *
 * @group Issues
 */
export type Message = MessageCallback | string;

/**
 * Returns a human-readable message that describes an issue.
 *
 * You can assign the {@link Issue.message} property directly inside this callback or return the message.
 *
 * @param issue The issue for which the message should be produced.
 * @param options The parsing options.
 * @returns The value that should be used as an issue message. The returned value is ignored if `issue.message` was
 * assigned a non-`undefined` value inside the callback.
 * @group Issues
 */
export type MessageCallback = (issue: Issue, options: ApplyOptions) => any;

/**
 * A callback that applies operations to the shape output.
 *
 * @param input The input value to which the shape was applied.
 * @param output The shape output value to which the operation must be applied.
 * @param options Parsing options.
 * @param issues The mutable array of issues captured by a shape, or `null` if there were no issues raised yet.
 * @returns The result of the operation.
 * @template ReturnValue The cumulative result of applied operations.
 * @group Operations
 */
export type ApplyOperationsCallback = (
  input: unknown,
  output: unknown,
  options: ApplyOptions,
  issues: Issue[] | null
) => Result | Promise<Result>;

/**
 * An operation that a shape applies to its output.
 *
 * @template Value The shape output value to which the operation must be applied.
 * @see {@link Shape.check}
 * @see {@link Shape.alter}
 * @see {@link Shape.refine}
 * @see {@link Shape.addOperation}
 * @see {@link Shape.checkAsync}
 * @see {@link Shape.alterAsync}
 * @see {@link Shape.refineAsync}
 * @see {@link Shape.addAsyncOperation}
 * @group Operations
 */
export interface Operation {
  /**
   * The type of the operation such as {@link StringShape.regex "string.regex"} or
   * {@link ArrayShape.includes "array.includes"}.
   */
  readonly type: any;

  /**
   * The additional param associated with the operation. Usually contains a {@link type}-specific data is used in the
   * {@link callback}.
   *
   * @see {@link Issue.param}
   */
  readonly param: any;

  /**
   * `true` if the operation callback may return a promise, or `false` otherwise.
   */
  readonly isAsync: boolean;

  /**
   * `true` if consequent operations must be omitted if this operation raises issues, of `false` otherwise.
   */
  readonly isRequired: boolean;

  /**
   * The callback that applies the logic of the operation to the shape output.
   */
  readonly callback: OperationCallback<Result> | OperationCallback<PromiseLike<Result>>;
}

/**
 * A callback that applies an operation to the shape output value.
 *
 * If a {@link ValidationError} is thrown, its issues are captured and incorporated into a parsing result.
 *
 * @param value The shape output value to which the operation must be applied.
 * @param param The {@link Operation.param additional param} that was associated with the operation.
 * @param options Parsing options.
 * @template ReturnValue The value returned by the operation.
 * @template Value The shape output value to which the operation must be applied.
 * @template Param The {@link Operation.param additional param} that was associated with the operation.
 * @group Operations
 */
export type OperationCallback<ReturnValue = any, Value = any, Param = any> = (
  value: Value,
  param: Param,
  options: ApplyOptions
) => ReturnValue;

/**
 * Options of an {@link Operation operation}.
 *
 * @group Operations
 */
export interface OperationOptions {
  /**
   * The type of the operation. If omitted then operation callback is used as its type.
   *
   * @see {@link Operation.type}
   */
  type?: any;

  /**
   * The additional param associated with the operation.
   *
   * @see {@link Operation.param}
   * @default undefined
   */
  param?: any;

  /**
   * If `true` then consequent operations are omitted if this operation raises issues.
   *
   * @see {@link Operation.isRequired}
   * @default false
   */
  required?: boolean;
}

/**
 * @inheritDoc
 * @template Param The param that is passed to a callback when an operation is applied.
 * @group Operations
 */
export interface ParameterizedOperationOptions<Param> extends OperationOptions {
  param: Param;
}

/**
 * A [narrowing predicate](https://www.typescriptlang.org/docs/handbook/2/narrowing.html) that refines the value type.
 *
 * If a {@link ValidationError} is thrown, its issues are captured and incorporated into a parsing result. Throw if
 * refinement cannot be performed, and you want to abort the operation.
 *
 * @param value The value to refine.
 * @param param The additional param that was associated with the operation.
 * @param options Parsing options.
 * @returns `true` if value matches the predicate, or `false` otherwise.
 * @template Value The value to refine.
 * @template RefinedValue The refined value.
 * @template Param The additional param that was associated with the operation.
 * @see {@link Shape.refine}
 * @group Operations
 */
export type RefinePredicate<Value = any, RefinedValue extends Value = Value, Param = any> = (
  value: Value,
  param: Param,
  options: ApplyOptions
) => value is RefinedValue;

/**
 * Options of {@link Shape.refine a refinement operation}.
 *
 * @group Operations
 */
export interface RefineOptions extends OperationOptions, IssueOptions {
  /**
   * The code of an issue that would be raised if the refinement fails.
   *
   * @default "any.refine"
   * @see {@link Issue.code}
   */
  code?: any;
}

/**
 * @inheritDoc
 * @template Param The param that is passed to a callback when an operation is applied.
 * @group Operations
 */
export interface ParameterizedRefineOptions<Param> extends RefineOptions {
  param: Param;
}

/**
 * Options used when a shape is applied to an input value.
 *
 * @see {@link Shape._apply}
 * @see {@link Shape._applyAsync}
 * @group Other
 */
export interface ApplyOptions {
  /**
   * If `true` then parsing is aborted after the first issue is encountered.
   *
   * @default false
   */
  readonly earlyReturn?: boolean;

  /**
   * The custom context.
   */
  readonly context?: any;
}

/**
 * Returns a human-readable message that describes issues that were raised during input parsing.
 *
 * @param issues The array of issues that were raised.
 * @param input The input value that was parsed.
 * @see {@link ParseOptions.errorMessage}
 * @group Other
 */
export type ErrorMessageCallback = (issues: Issue[], input: any) => string;

/**
 * Options used during parsing.
 *
 * @group Other
 */
export interface ParseOptions extends ApplyOptions {
  /**
   * A message that is passed to {@link ValidationError} if issues are raised during parsing.
   */
  readonly errorMessage?: ErrorMessageCallback | string;
}

/**
 * A literal value of any type.
 *
 * @group Other
 */
export type Any = object | string | number | bigint | boolean | symbol | null | undefined;

export type CheckResult = Issue[] | Issue | null | undefined | void;
