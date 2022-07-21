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
   * An additional param that is specific for {@link code}.
   */
  param: any;
}

export type Several<T> = [T, ...T[]];

export type Primitive = string | number | bigint | boolean | null | undefined;

export interface Dict<T = any> {
  [key: string]: T;
}
