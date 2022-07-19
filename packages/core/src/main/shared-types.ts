export interface Issue {
  code: string;
  path: any[];
  input: any;
  param: any;
}

export type Intersection<U> = (U extends any ? (args: U) => void : never) extends (args: infer I) => void ? I : never;

export type Awaitable<T> = Promise<T> | T;

export type Primitive = string | number | bigint | boolean | null | undefined;

export interface Dict<T = any> {
  [key: string]: T;
}

export type RaiseIssue = <T extends Issue>(issue: T) => any;
