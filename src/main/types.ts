/**
 * A validation issue raised during input parsing.
 *
 * @group Validation Errors
 */
export interface Issue {
  /**
   * A code of the validation issue, which uniquely identifies the reason of an issue. For all built-in checks, a code
   * can be used to infer the type of the {@linkcode param}.
   *
   * @see [Validation errors](https://github.com/smikhalevski/doubter#validation-errors)
   */
  code?: any;

  /**
   * An object path to {@linkcode input} value starting from the parsed object. Both an empty array and `undefined` mean
   * that an issue is caused by the {@linkcode input} value itself.
   *
   * @example ```ts
   * ['users', 0, 'age']
   * ```
   *
   * @see {@linkcode Shape#at Shape.at}
   */
  path?: any[];

  /**
   * The input value that caused a validation issue. Note that if coercion is enabled this contains a coerced value.
   *
   * @see [Type coercion](https://github.com/smikhalevski/doubter#type-coercion)
   */
  input?: any;

  /**
   * The human-readable issue message. Built-in messages are strings but custom messages can have an arbitrary type.
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
 * @see {@link Result}
 * @group Other
 */
export interface Ok<Value> {
  ok: true;

  /**
   * The output value.
   */
  value: Value;
}

/**
 * Carries the result of a failed input parsing.
 *
 * @see {@link Result}
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
 * - {@linkcode Ok} means the value was transformed during parsing.
 * - An array of {@link Issue issues} means that parsing has failed.
 * - `null` means that parsed value is valid and wasn't transformed.
 *
 * @template Value The output value.
 * @group Other
 */
export type Result<Value = any> = Ok<Value> | Issue[] | null;

/**
 * An operation that a shape applies to its output.
 *
 * This is the part of the internal API that can be used to add custom operations to shapes. For most cases,
 * {@linkcode Shape#check Shape.check}, {@linkcode Shape#alter Shape.alter}, and {@linkcode Shape#refine Shape.refine}
 * are a sufficient set of operations.
 */
export interface Operation {
  /**
   * The type of the operation, such as `check`, `alter`, etc.
   */
  type: any;

  /**
   * The kind of the operation in scope of its {@linkcode type}.
   *
   * For example, `string_min` and `array_includes` are checks, so they have type `check`; `string_trim` and
   * `array_truncate` are alterations, so they have type `alter`.
   */
  kind: any;

  /**
   * The additional payload associated with the operation. This payload contains a {@link type type-specific} data that
   * is required to create an {@linkcode ApplyOperation} callback.
   */
  payload: any;

  /**
   * `true` if the operation is applied even if some of the preceding operations have failed, or `false` otherwise.
   */
  isForced: boolean;
}

/**
 * A callback that applies an operation to the shape output.
 *
 * @param output The shape output value to which the operation must be applied.
 * @param options Parsing options.
 * @param changed `true` if the shape output value differs from the input value, or `false` otherwise.
 * @param issues The array of issues captured by a shape, or `null` if there were no issues raised yet.
 * @param result The container object to return the changed result, or `null` if such object wasn't created yet, or not
 * needed.
 * @see {@linkcode ApplyOperationFactory}
 * @group Shape Operations
 */
export type ApplyOperation = (
  output: any,
  options: ApplyOptions,
  changed: boolean,
  issues: Issue[] | null,
  result: Ok<any> | null
) => Result;

/**
 * Creates a callback that applies an operation and then delegates further processing to the next operation in the
 * queue.
 *
 * @param operation The operation for which the callback is created.
 * @param next The callback that applies the next operation in the queue, or `null` if there are no more operations.
 * @group Shape Operations
 */
export type ApplyOperationFactory = (operation: Operation, next: ApplyOperation | null) => ApplyOperation;

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
 * Options of the {@linkcode Shape#check} method.
 *
 * @group Shape Operations
 */
export interface CheckOptions {
  /**
   * The kind of the check operation: `string_min`, `object_exact`, `array_includes`, etc.
   */
  kind?: any;

  /**
   * The additional param that would be passed to the callback when a check operation is applied.
   *
   * @default undefined
   */
  param?: any;

  /**
   * If `true` then the check is applied even if some of the preceding operations have failed, or `false` otherwise.
   *
   * @default false
   */
  force?: boolean;
}

/**
 * Checks that a value matches a predicate.
 *
 * If a {@linkcode ValidationError} is thrown, its issues are captured and incorporated into a parsing result. Throw if
 * refinement cannot be performed, and you want to abort the operation.
 *
 * @param value The value to check.
 * @param options Parsing options.
 * @return Truthy if value matches the predicate, or falsy otherwise.
 * @template Value The value to check.
 * @see {@linkcode Shape#refine}
 * @group Shape Operations
 */
export type RefineCallback<Value = any> = (value: Value, options: Readonly<ApplyOptions>) => any;

/**
 * A [narrowing predicate](https://www.typescriptlang.org/docs/handbook/2/narrowing.html) that refines the value type.
 *
 * If a {@linkcode ValidationError} is thrown, its issues are captured and incorporated into a parsing result. Throw if
 * refinement cannot be performed, and you want to abort the operation.
 *
 * @param value The value to refine.
 * @param options Parsing options.
 * @return `true` if value matches the predicate, or `false` otherwise.
 * @template Value The value to refine.
 * @template RefinedValue The refined value.
 * @see {@linkcode Shape#refine}
 * @group Shape Operations
 */
export type RefinePredicate<Value = any, RefinedValue extends Value = Value> = (
  value: Value,
  options: Readonly<ApplyOptions>
) => value is RefinedValue;

/**
 * Options of the {@linkcode Shape#refine} method.
 *
 * @group Shape Operations
 */
export interface RefineOptions extends ConstraintOptions {
  /**
   * The kind of the check operation: `string_min`, `object_exact`, `array_includes`, etc.
   */
  kind?: any;

  /**
   * The code of an issue that would be raised if the check fails.
   *
   * @default "predicate"
   */
  code?: any;

  /**
   * If `true` then the check is applied even if some of the preceding operations have failed, or `false` otherwise.
   *
   * @default false
   */
  force?: boolean;
}

/**
 * Alters the value without changing its base type.
 *
 * If you want to change the base type, consider using {@linkcode Shape#convert}.
 *
 * If a {@linkcode ValidationError} is thrown, its issues are captured and incorporated into a parsing result. Throw if
 * alteration cannot be performed, and you want to abort the operation.
 *
 * @param value The value to alter.
 * @param param The additional param that was associated with the alter operation.
 * @param options Parsing options.
 * @returns The altered value.
 * @template Value The value to alter.
 * @template AlteredValue The altered value.
 * @template Param The additional param that was associated with the alter operation.
 * @see {@linkcode Shape#alter} {@linkcode Shape#convert}
 * @group Shape Operations
 */
export type AlterCallback<Value = any, AlteredValue extends Value = Value, Param = any> = (
  value: Value,
  param: Param,
  options: Readonly<ApplyOptions>
) => AlteredValue;

/**
 * Options of the {@linkcode Shape#alter} method.
 *
 * @group Shape Operations
 */
export interface AlterOptions {
  /**
   * The kind of the check operation: `string_trim`, `date_set_timezone`, `array_truncate`, etc.
   */
  kind?: any;

  /**
   * The additional param that would be passed to the {@linkcode AlterCallback} when an alteration operation is
   * applied.
   */
  param?: any;
}

/**
 * A callback that returns a message for an issue. You can assign the {@linkcode Issue#message issue.message} property
 * directly inside this callback or return the message.
 *
 * @param issue The issue for which the message should be produced.
 * @param options The parsing options.
 * @returns Any value that should be used as an issue message.
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
 * Options that are applicable for the built-in type-specific constraints.
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
 * Options used during parsing.
 *
 * @group Other
 */
export interface ParseOptions extends ApplyOptions {
  /**
   * A message that is passed to {@linkcode ValidationError} if issues are raised during parsing.
   */
  errorMessage?: ((issues: Issue[], input: any) => string) | string;
}

/**
 * A literal value of any type.
 *
 * @group Other
 */
export type Literal = object | string | number | bigint | boolean | symbol | null | undefined;
