/**
 * A validation issue raised during input parsing.
 *
 * @group Errors
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
   * An additional payload.
   */
  payload?: any;

  /**
   * An arbitrary metadata associated with this issue.
   *
   * @see {@linkcode ConstraintOptions#meta}
   */
  meta?: any;
}

/**
 * Carries the result of a successful input parsing.
 *
 * @template Value The output value.
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
 * Checks that a value satisfies requirements.
 *
 * If a {@linkcode ValidationError} is thrown, its issues are treated as if they were returned from a check callback.
 *
 * @param value The value to check.
 * @param payload The additional payload that was associated with the check operation.
 * @param options Parsing options.
 * @returns `null` or `undefined` if the value satisfies requirements; an issue or an array of issues if a value doesn't
 * satisfy  requirements.
 * @template Value The value to check.
 * @template Payload The additional payload that was associated with the check operation.
 * @see {@linkcode Shape#check}
 * @group Shape Operations
 */
export type CheckCallback<Value = any, Payload = any> = (
  value: Value,
  payload: Payload,
  options: Readonly<ApplyOptions>
) => Issue[] | Issue | null | undefined | void;

/**
 * The operation that describes a value check.
 *
 * @see {@linkcode Shape#check}
 * @group Shape Operations
 */
export interface CheckOperation {
  type: 'check';

  /**
   * The check operation key.
   */
  key: any;

  /**
   * The callback that applies check to a value.
   */
  apply: CheckCallback;

  /**
   * The additional payload passed to the {@linkcode apply} callback.
   */
  payload: any;

  /**
   * `true` if the check is applied even if some of the preceding checks have failed, or `false` otherwise.
   */
  isForced: boolean;
}

/**
 * Options of the {@linkcode Shape#check} method.
 *
 * @group Shape Operations
 */
export interface CheckOptions {
  /**
   * The check operation key.
   */
  key?: any;

  /**
   * The additional payload that would be passed to the {@linkcode CheckCallback} when a check operation is applied.
   *
   * @default undefined
   */
  payload?: any;

  /**
   * If `true` then the check is applied even if some of the preceding checks have failed, or `false` otherwise.
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
 * @return `true` if value matches the predicate, or `false` otherwise.
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
   * The operation key, unique in the scope of the shape.
   */
  key?: unknown;

  /**
   * The custom issue code.
   *
   * @default
   * "predicate"
   */
  code?: any;

  /**
   * If `true` then the refinement is applied even if some of the preceding checks have failed, or `false` otherwise.
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
 * @param payload The additional payload that was associated with the alter operation.
 * @param options Parsing options.
 * @returns The altered value.
 * @template Value The value to alter.
 * @template AlteredValue The altered value.
 * @template Payload The additional payload that was associated with the alter operation.
 * @see {@linkcode Shape#alter}
 * @see {@linkcode Shape#convert}
 * @group Shape Operations
 */
export type AlterCallback<Value = any, AlteredValue extends Value = Value, Payload = any> = (
  value: Value,
  payload: Payload,
  options: Readonly<ApplyOptions>
) => AlteredValue;

/**
 * The operation that describes a value alteration.
 *
 * @see {@linkcode Shape#alter}
 * @group Shape Operations
 */
export interface AlterOperation {
  type: 'alter';

  /**
   * The alteration operation key.
   */
  key: any;

  /**
   * The callback that alters a value.
   */
  apply: AlterCallback;

  /**
   * The additional payload passed to the {@linkcode apply} callback.
   */
  payload: any;
}

/**
 * Options of the {@linkcode Shape#alter} method.
 *
 * @group Shape Operations
 */
export interface AlterOptions {
  /**
   * The alteration operation key.
   */
  key?: any;

  /**
   * The additional payload that would be passed to the {@linkcode AlterCallback} when an alteration operation is
   * applied.
   */
  payload?: any;
}

/**
 * An operation that a shape applies after an input value type is ensured.
 */
export type Operation = CheckOperation | AlterOperation;

/**
 * The callback that returns a message for an issue. You can assign the {@linkcode Issue#message issue.message} property
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
 * the {@link CheckOptions#payload issue payload}.
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
 * The literal value of any type.
 *
 * @group Other
 */
export type Literal = object | string | number | bigint | boolean | symbol | null | undefined;
