/**
 * A validation issue raised during input parsing.
 *
 * @group Validation Errors
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
 * The result that shape returns after being applied to an input value.
 *
 * This is the part of the internal API required for creating custom shapes.
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
 * A callback that applies an operation to the shape output.
 *
 * @param input The input value to which the shape was applied.
 * @param output The shape output value to which the operation must be applied.
 * @param options Parsing options.
 * @param issues The mutable array of issues captured by a shape, or `null` if there were no issues raised yet.
 * @returns The result of the operation.
 * @template InputValue The input value to which the shape was applied.
 * @template OutputValue The shape output value to which the operation must be applied.
 * @group Shape Operations
 */
export type OperationCallback<InputValue = any, OutputValue = any> = (
  input: InputValue,
  output: OutputValue,
  options: Readonly<ApplyOptions>,
  issues: Issue[] | null
) => Result;

/**
 * An operation that a shape applies to its output.
 *
 * @template InputValue The input value to which the shape was applied.
 * @template OutputValue The shape output value to which the operation must be applied.
 * @see {@linkcode Shape#check Shape.check}
 * @see {@linkcode Shape#alter Shape.alter}
 * @see {@linkcode Shape#refine Shape.refine}
 */
export interface Operation<InputValue = any, OutputValue = any> {
  /**
   * The type of the operation such as {@linkcode StringShape#regex "string_regex"} or
   * {@linkcode ArrayShape#includes "array_includes"}.
   */
  type: any;

  /**
   * The additional param associated with the operation.
   *
   * This param usually contains a {@link type type-specific} data is used in the {@link OperationCallback callback}
   * returned by {@linkcode compile} method.
   */
  param: any;

  /**
   * Creates an {@link OperationCallback} that applies the logic of this operation to the shape output and passes
   * control to the next operation.
   *
   * @param next The callback that applies the next operation.
   */
  compile(this: Operation, next: OperationCallback): OperationCallback<InputValue, OutputValue>;
}

/**
 * Checks that a value satisfies a requirement.
 *
 * If a {@linkcode ValidationError} is thrown, its issues are treated as if they were returned from a check callback.
 *
 * @param value The value to check.
 * @param param The additional param that was associated with the check operation.
 * @param options Parsing options.
 * @returns `null` or `undefined` if the value satisfies a requirement; an issue or an array of issues if a value
 * doesn't satisfy a requirement.
 * @template Value The value to check.
 * @template Param The additional param that was associated with the check operation.
 * @see {@linkcode Shape#check}
 * @group Shape Operations
 */
export type CheckCallback<Value = any, Param = any> = (
  value: Value,
  param: Param,
  options: Readonly<ApplyOptions>
) => Issue[] | Issue | null | undefined | void;

/**
 * Options of {@link Shape#check a check operation}.
 *
 * @group Shape Operations
 */
export interface CheckOptions {
  /**
   * {@link Operation#type The type of the check operation.}
   */
  type?: any;

  /**
   * The additional param that would be passed to the {@linkcode CheckCallback} when a check operation is applied.
   *
   * The param can be later accessed via {@linkcode Operation#param Operation.param} for introspection.
   */
  param?: any;

  /**
   * If `true` then the check is applied even if some of the preceding operations have failed.
   *
   * @default false
   */
  force?: boolean;
}

/**
 * @inheritDoc
 * @template Param The param that is passed to the {@linkcode CheckCallback} when a check operation is applied.
 */
export interface ParameterizedCheckOptions<Param> extends CheckOptions {
  param: Param;
}

/**
 * Checks that a value matches a predicate.
 *
 * If a {@linkcode ValidationError} is thrown, its issues are captured and incorporated into a parsing result. Throw if
 * refinement cannot be performed, and you want to abort the operation.
 *
 * @param value The value to refine.
 * @param param The additional param that was associated with the refinement operation.
 * @param options Parsing options.
 * @return Truthy if value matches the predicate, or falsy otherwise.
 * @template Value The value to check.
 * @template Param The additional param that was associated with the refinement operation.
 * @see {@linkcode Shape#refine}
 * @group Shape Operations
 */
export type RefineCallback<Value = any, Param = any> = (
  value: Value,
  param: Param,
  options: Readonly<ApplyOptions>
) => any;

/**
 * A [narrowing predicate](https://www.typescriptlang.org/docs/handbook/2/narrowing.html) that refines the value type.
 *
 * If a {@linkcode ValidationError} is thrown, its issues are captured and incorporated into a parsing result. Throw if
 * refinement cannot be performed, and you want to abort the operation.
 *
 * @param value The value to refine.
 * @param param The additional param that was associated with the refinement operation.
 * @param options Parsing options.
 * @return `true` if value matches the predicate, or `false` otherwise.
 * @template Value The value to refine.
 * @template RefinedValue The refined value.
 * @template Param The additional param that was associated with the refinement operation.
 * @see {@linkcode Shape#refine}
 * @group Shape Operations
 */
export type RefinePredicate<Value = any, RefinedValue extends Value = Value, Param = any> = (
  value: Value,
  param: Param,
  options: Readonly<ApplyOptions>
) => value is RefinedValue;

/**
 * Options of {@link Shape#refine a refinement operation}.
 *
 * @group Shape Operations
 */
export interface RefineOptions extends ConstraintOptions {
  /**
   * {@link Operation#type The type of the refinement operation.}
   */
  type?: any;

  /**
   * The code of an issue that would be raised if the refinement fails.
   *
   * @default "predicate"
   */
  code?: any;

  /**
   * The additional param that would be passed to the {@linkcode RefineCallback} when a refinement operation is applied.
   *
   * The param can be later accessed via {@linkcode Operation#param Operation.param} for introspection.
   */
  param?: any;

  /**
   * If `true` then the refinement is applied even if some of the preceding operations have failed.
   *
   * @default false
   */
  force?: boolean;
}

/**
 * @inheritDoc
 * @template Param The param that is passed to the {@linkcode RefineCallback} when a refinement operation is applied.
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
 * @param param The additional param that was associated with the alteration operation.
 * @param options Parsing options.
 * @returns The altered value.
 * @template Value The value to alter.
 * @template AlteredValue The altered value.
 * @template Param The additional param that was associated with the alteration operation.
 * @see {@linkcode Shape#alter}
 * @see {@linkcode Shape#convert}
 * @group Shape Operations
 */
export type AlterCallback<Value = any, AlteredValue extends Value = Value, Param = any> = (
  value: Value,
  param: Param,
  options: Readonly<ApplyOptions>
) => AlteredValue;

/**
 * Options of {@link Shape#alter an alteration operation}.
 *
 * @group Shape Operations
 */
export interface AlterOptions {
  /**
   * {@link Operation#type The type of the alteration operation.}
   */
  type?: any;

  /**
   * The additional param that would be passed to the {@linkcode AlterCallback} when an alteration operation is
   * applied.
   *
   * The param can be later accessed via {@linkcode Operation#param Operation.param} for introspection.
   */
  param?: any;

  /**
   * If `true` then the alteration is applied even if some of the preceding operations have failed.
   *
   * @default false
   */
  force?: boolean;
}

/**
 * @inheritDoc
 * @template Param The param that is passed to the {@linkcode AlterCallback} when an alteration operation is applied.
 */
export interface ParameterizedAlterOptions<Param> extends AlterOptions {
  param: Param;
}

/**
 * Returns a human-readable message that describes an issue.
 *
 * You can assign the {@linkcode Issue#message issue.message} property directly inside this callback or return the
 * message.
 *
 * @param issue The issue for which the message should be produced.
 * @param options The parsing options.
 * @returns The value that should be used as an issue message.
 * @group Other
 */
export type MessageCallback = (issue: Issue, options: Readonly<ApplyOptions>) => any;

/**
 * A callback that returns an issue message or a message string. `%s` placeholder in string messages is replaced with
 * the {@link CheckOptions#param issue param}.
 *
 * @group Other
 */
export type Message = MessageCallback | string;

/**
 * Options that are applicable for the built-in type-related constraints.
 *
 * @group Other
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

/**
 * Options used during parsing.
 *
 * @group Other
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
   * If `true` then shapes that support input value type coercion, would try to coerce an input to a required type.
   *
   * @default false
   */
  coerce?: boolean;

  /**
   * The custom context.
   */
  context?: any;
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
  errorMessage?: ErrorMessageCallback | string;
}

/**
 * A literal value of any type.
 *
 * @group Other
 */
export type Literal = object | string | number | bigint | boolean | symbol | null | undefined;
