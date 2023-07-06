/**
 * A result returned from a shape after it was applied to an input value.
 *
 * - `null` if the output is the same as the input;
 * - an {@linkcode Ok} object if the output contains a new value;
 * - an array of {@linkcode Issue} objects if parsing failed.
 *
 * - If `null` then the input value is valid and wasn't transformed.
 * - If an {@linkcode Ok} instance then the input value is valid and was transformed.
 * - If an array of {@link Issue issues} then the input value is invalid.
 *
 * @template Value The output value.
 * @see {@linkcode Shape#_apply Shape._apply}
 * @see {@linkcode Shape#_applyAsync Shape._applyAsync}
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
   * For all built-in shape operations, a code can be used to infer the type of the {@linkcode param}.
   *
   * @see [Validation errors](https://github.com/smikhalevski/doubter#validation-errors)
   */
  code?: any;

  /**
   * An object path to {@linkcode input} value starting from the parsed object. Both an empty array and `undefined` mean
   * that an issue is caused by the {@linkcode input} value itself.
   *
   * @example ['users', 0, 'age']
   * @see {@linkcode Shape#at Shape.at}
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
 * @see {@linkcode Issue}
 * @group Issues
 */
export interface IssueOptions {
  /**
   * The custom issue message.
   *
   * @see {@linkcode Message}
   * @see {@linkcode Issue#message Issue.message}
   */
  message?: Message | any;

  /**
   * An arbitrary metadata that is added to an issue.
   *
   * @see {@linkcode Issue#meta Issue.meta}
   */
  meta?: any;
}

/**
 * A callback that returns an issue message, or an issue message string.
 *
 * `%s` placeholder in string messages is replaced with the {@link Issue#param issue param}.
 *
 * @group Issues
 */
export type Message = MessageCallback | string;

/**
 * Returns a human-readable message that describes an issue.
 *
 * You can assign the {@linkcode Issue#message issue.message} property directly inside this callback or return the
 * message.
 *
 * @param issue The issue for which the message should be produced.
 * @param options The parsing options.
 * @returns The value that should be used as an issue message. The returned value is ignored if `issue.message` was
 * assigned a non-`undefined` value inside the callback.
 * @group Issues
 */
export type MessageCallback = (issue: Issue, options: ApplyOptions) => any;

/**
 * An operation that a shape applies to its output.
 *
 * @template InputValue The input value to which the shape was applied.
 * @template OutputValue The shape output value to which the operation must be applied.
 * @see {@linkcode Shape#check Shape.check}
 * @see {@linkcode Shape#alter Shape.alter}
 * @see {@linkcode Shape#refine Shape.refine}
 * @see {@linkcode Shape#addOperation Shape.addOperation}
 * @group Operations
 */
export interface Operation<InputValue = any, OutputValue = any> {
  /**
   * The type of the operation such as {@linkcode StringShape#regex "string_regex"} or
   * {@linkcode ArrayShape#includes "array_includes"}.
   */
  readonly type: any;

  /**
   * The additional param associated with the operation.
   *
   * This param usually contains a {@link type type-specific} data is used in the {@link OperationCallback callback}
   * returned by the {@linkcode compose} method.
   *
   * Built-in operations use the same param for an operation and an issue that is raised if an operation fails.
   *
   * @see {@linkcode Issue#param Issue.param}
   */
  readonly param: any;

  /**
   * Creates an {@link OperationCallback} that applies the logic of this operation to the shape output and passes
   * control to the next operation.
   *
   * @param next The callback that applies the next operation.
   * @returns The callback that applies an operation to the shape output.
   */
  readonly compose: (this: Operation, next: OperationCallback) => OperationCallback<InputValue, OutputValue>;
}

/**
 * A callback that applies an operation to the shape output.
 *
 * @param input The input value to which the shape was applied.
 * @param output The shape output value to which the operation must be applied.
 * @param options Parsing options.
 * @param issues The mutable array of issues captured by a shape, or `null` if there were no issues raised yet.
 * @returns The result of the operation.
 * @template InputValue The input value to which the shape was applied.
 * @template OutputValue The shape output value to which the operation must be applied.
 * @see {@linkcode Operation#compose Operation.compose}
 * @group Operations
 */
export type OperationCallback<InputValue = any, OutputValue = any> = (
  input: InputValue,
  output: OutputValue,
  options: ApplyOptions,
  issues: Issue[] | null
) => Result;

/**
 * Options of a custom {@link Operation operation}.
 *
 * @see {@linkcode Shape#check Shape.check}
 * @see {@linkcode Shape#alter Shape.alter}
 * @see {@linkcode Shape#refine Shape.refine}
 * @group Operations
 */
export interface OperationOptions {
  /**
   * The type of the operation.
   *
   * @see {@linkcode Operation#type Operation.type}
   */
  type?: any;

  /**
   * The additional param associated with the operation.
   *
   * @see {@linkcode Operation#param Operation.param}
   */
  param?: any;

  /**
   * If `true` then the operation is applied even if some of the preceding operations have failed.
   *
   * @default false
   */
  force?: boolean;
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
 * Checks that a value satisfies a requirement and returns issues if it doesn't.
 *
 * If a {@linkcode ValidationError} is thrown, its issues are captured and incorporated into a parsing result.
 *
 * @param value The value to check.
 * @param param The additional param that was associated with the operation.
 * @param options Parsing options.
 * @returns `null` or `undefined` if the value satisfies a requirement; an issue or an array of issues if a value
 * doesn't satisfy a requirement.
 * @template Value The value to check.
 * @template Param The additional param that was associated with the check operation.
 * @see {@linkcode Shape#check}
 * @group Operations
 */
export type CheckCallback<Value = any, Param = any> = (
  value: Value,
  param: Param,
  options: ApplyOptions
) => Issue[] | Issue | null | undefined | void;

/**
 * Checks that a value matches a predicate.
 *
 * If a {@linkcode ValidationError} is thrown, its issues are captured and incorporated into a parsing result. Throw if
 * refinement cannot be performed, and you want to abort the operation.
 *
 * @param value The value to refine.
 * @param param The additional param that was associated with the operation.
 * @param options Parsing options.
 * @return Truthy if value matches the predicate, or falsy if it doesn't.
 * @template Value The value to refine.
 * @template Param The additional param that was associated with the operation.
 * @see {@linkcode Shape#refine}
 * @group Operations
 */
export type RefineCallback<Value = any, Param = any> = (value: Value, param: Param, options: ApplyOptions) => any;

/**
 * A [narrowing predicate](https://www.typescriptlang.org/docs/handbook/2/narrowing.html) that refines the value type.
 *
 * If a {@linkcode ValidationError} is thrown, its issues are captured and incorporated into a parsing result. Throw if
 * refinement cannot be performed, and you want to abort the operation.
 *
 * @param value The value to refine.
 * @param param The additional param that was associated with the operation.
 * @param options Parsing options.
 * @return `true` if value matches the predicate, or `false` otherwise.
 * @template Value The value to refine.
 * @template RefinedValue The refined value.
 * @template Param The additional param that was associated with the operation.
 * @see {@linkcode Shape#refine}
 * @group Operations
 */
export type RefinePredicate<Value = any, RefinedValue extends Value = Value, Param = any> = (
  value: Value,
  param: Param,
  options: ApplyOptions
) => value is RefinedValue;

/**
 * Options of {@link Shape#refine a refinement operation}.
 *
 * @group Operations
 */
export interface RefineOptions extends OperationOptions, IssueOptions {
  /**
   * The code of an issue that would be raised if the refinement fails.
   *
   * @default "predicate"
   * @see {@linkcode Issue#code Issue.code}
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
 * Alters the value without changing its base type.
 *
 * If you want to change the base type, consider using {@linkcode Shape#convert Shape.convert}.
 *
 * If a {@linkcode ValidationError} is thrown, its issues are captured and incorporated into a parsing result. Throw if
 * alteration cannot be performed, and you want to abort the operation.
 *
 * @param value The value to alter.
 * @param param The additional param that was associated with the operation.
 * @param options Parsing options.
 * @returns The altered value.
 * @template Value The value to alter.
 * @template Param The additional param that was associated with the operation.
 * @see {@linkcode Shape#alter}
 * @see {@linkcode Shape#convert}
 * @group Operations
 */
export type AlterCallback<Value = any, Param = any> = (value: Value, param: Param, options: ApplyOptions) => Value;

/**
 * Options used when a shape is applied to an input value.
 *
 * @see {@linkcode Shape#_apply Shape._apply}
 * @see {@linkcode Shape#_applyAsync Shape._applyAsync}
 * @group Other
 */
export interface ApplyOptions {
  /**
   * If `true` then all issues are collected during parsing, otherwise parsing is aborted after the first issue is
   * encountered.
   *
   * @default false
   */
  readonly verbose?: boolean;

  /**
   * If `true` then shapes that support input value type coercion, would try to coerce an input to a required type.
   *
   * @default false
   */
  readonly coerce?: boolean;

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
 * @see {@linkcode ParseOptions#errorMessage ParseOptions.errorMessage}
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
   * A message that is passed to {@linkcode ValidationError} if issues are raised during parsing.
   */
  readonly errorMessage?: ErrorMessageCallback | string;
}

/**
 * A literal value of any type.
 *
 * @group Other
 */
export type Literal = object | string | number | bigint | boolean | symbol | null | undefined;
