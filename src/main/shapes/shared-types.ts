/**
 * A validation issue raised during input parsing.
 */
export interface Issue {
  /**
   * The unique code of the validation issue.
   */
  code: string;

  /**
   * The object path to the field where an issue has occurred.
   */
  path: any[];

  /**
   * The input value that caused an issue.
   */
  input: any;

  /**
   * A message associated with an issue. Built-in messages are strings but custom messages can have an arbitrary type.
   */
  message: any;

  /**
   * An additional param that is specific for {@link code}.
   */
  param?: any;

  /**
   * An arbitrary metadata that can be used for message formatting.
   */
  meta?: any;
}

export type Several<T> = [T, ...T[]];

export type Primitive = string | number | bigint | boolean | null | undefined;

export interface Dict<T = any> {
  [key: string]: T;
}

export interface ConstraintOptions {
  /**
   * The custom issue message.
   */
  message?: any;

  /**
   * An arbitrary metadata that is added to an issue.
   */
  meta?: any;
}

export interface ParserOptions {
  /**
   * If `true` then parsing should end as soon as the first error is captured, otherwise maximum number of errors should
   * be collected before parsing is terminated.
   *
   * @default false
   */
  fast?: boolean;
}
