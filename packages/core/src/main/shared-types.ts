import { Type } from './types/Type';
import { ValueType } from './utils';

export interface Issue {
  code: any;
  path: any[];
  value: any;
  valueType: ValueType;
  param: any;
}

export type RaiseIssue = <E extends Issue>(issue: E) => any;

/**
 * Infers the type from the type definition.
 */
export type InferType<X extends Type> = X extends Type<infer T> ? T : never;

// prettier-ignore
export type UnionToIntersection<U> = (U extends any ? (args: U) => void : never) extends (args: infer I) => void ? I : never;

export type Awaitable<T> = Promise<T> | T;

export type Primitive = string | number | bigint | boolean | null | undefined;

export interface Dict<T = any> {
  [key: string]: T;
}

/**
 * The transformer that converts the input value to the output type.
 *
 * @param value The input value that must be transformed.
 * @param raiseIssue The callback that raises a validation issue to notify the parser that value cannot be
 * transformed.
 */
export type Transformer<I, O> = (value: I, raiseIssue: RaiseIssue) => O;

/**
 * The predicate that check that value conforms a condition.
 *
 * @param value The value to check.
 * @returns `true` if the value conforms the condition, or `false` otherwise.
 */
export type Predicate<T> = (value: T) => boolean;
