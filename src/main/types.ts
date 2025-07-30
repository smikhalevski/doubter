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
   * @see [Annotations and metadata](https://github.com/smikhalevski/doubter#annotations-and-metadata)
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
 * @returns The value that should be used as an issue message. If a non-`undefined` value is returned, it is assigned
 * to the  {@link Issue.message} property.
 * @group Issues
 */
export type MessageCallback = (issue: Issue, options: ParseOptions) => any;

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
   * The additional param associated with the operation. Usually contains a {@link Operation.type}-specific data is used
   * in the {@link Operation.callback}.
   */
  readonly param: any;

  /**
   * `true` if the operation callback may return a promise, or `false` otherwise.
   */
  readonly isAsync: boolean;

  /**
   * The operation tolerance for issues that are raised during validation.
   *
   * <dl>
   *   <dt>"skip"</dt>
   *   <dd>If preceding operations have raised issues, then this operation is skipped but consequent operations are
   *   still applied.</dd>
   *   <dt>"abort"</dt>
   *   <dd>If preceding operations have raised issues, then this operation is skipped and consequent operations aren't
   *   applied. Also, if this operation itself raises issues then consequent operations aren't applied either.</dd>
   *   <dt>"auto"</dt>
   *   <dd>The operation is applied regardless of previously raised issues.</dd>
   * </dl>
   */
  readonly tolerance: OperationTolerance;

  /**
   * The callback that applies the logic of the operation to the shape output.
   */
  readonly callback: OperationCallback<Result> | OperationCallback<PromiseLike<Result>>;
}

/**
 * Defines the operation tolerance for issues that are raised during validation.
 *
 * <dl>
 *   <dt>"skip"</dt>
 *   <dd>If preceding operations have raised issues, then this operation is skipped but consequent operations are
 *   still applied.</dd>
 *   <dt>"abort"</dt>
 *   <dd>If preceding operations have raised issues, then this operation is skipped and consequent operations aren't
 *   applied. Also, if this operation itself raises issues then consequent operations aren't applied either.</dd>
 *   <dt>"auto"</dt>
 *   <dd>The operation is applied regardless of previously raised issues.</dd>
 * </dl>
 *
 * @see {@link Operation.tolerance}
 * @group Operations
 */
export type OperationTolerance = 'skip' | 'abort' | 'auto';

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
  options: ParseOptions
) => ReturnValue;

/**
 * Options of an {@link Operation operation}.
 *
 * @group Operations
 */
export interface OperationOptions {
  /**
   * The type of the operation such as {@link StringShape.regex "string.regex"} or
   * {@link ArrayShape.includes "array.includes"}. If omitted then operation callback is used as its type.
   *
   * @see {@link Operation.type}
   */
  type?: any;

  /**
   * The additional param associated with the operation. Usually contains a {@link OperationOptions.type type}-specific
   * data is used in the {@link Operation.callback}.
   *
   * @see {@link Operation.param}
   * @default undefined
   */
  param?: any;

  /**
   * The operation tolerance for issues that are raised during validation.
   *
   * <dl>
   *   <dt>"skip"</dt>
   *   <dd>If preceding operations have raised issues, then this operation is skipped but consequent operations are
   *   still applied.</dd>
   *   <dt>"abort"</dt>
   *   <dd>If preceding operations have raised issues, then this operation is skipped and consequent operations aren't
   *   applied. Also, if this operation itself raises issues then consequent operations aren't applied either.</dd>
   *   <dt>"auto"</dt>
   *   <dd>The operation is applied regardless of previously raised issues.</dd>
   * </dl>
   *
   * @see {@link Operation.tolerance}
   * @default 'auto'
   */
  tolerance?: OperationTolerance;
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
  options: ParseOptions
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
 * Options used during parsing.
 *
 * @group Other
 */
export interface ParseOptions {
  /**
   * If `true` then parsing is aborted after the first issue is encountered.
   *
   * @default false
   */
  isEarlyReturn?: boolean;

  /**
   * The custom context.
   */
  context?: any;

  /**
   * The map from an error code to a default issue message.
   */
  messages?: { [code: string | number]: Message | Any };
}

/**
 * A literal value of any type. This type is used to enforce the narrowing of generic types.
 *
 * @group Other
 */
export type Any = object | string | number | bigint | boolean | symbol | null | undefined;

/**
 * The result returned by a {@link Shape.check check operation callback}.
 *
 * @group Other
 */
export type CheckResult = Issue[] | Issue | null | undefined | void;
