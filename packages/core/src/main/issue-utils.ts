import { ParserContext } from './ParserContext';
import { IssueCode, ValueType } from './utils';
import { Primitive } from './shared-types';

export interface Issue {
  code: string;
  path: any[];
  value: any;
}

export interface InvalidTypeIssue extends Issue {
  code: IssueCode.INVALID_TYPE;
  expected: ValueType;
  received: ValueType;
}

export interface TooSmallIssue extends Issue {
  code: IssueCode.TOO_SMALL;
  type: ValueType;
  inclusive: boolean;
  expected: number;
  received: number;
}

export interface TooBigIssue extends Issue {
  code: IssueCode.TOO_BIG;
  type: ValueType;
  inclusive: boolean;
  expected: number;
  received: number;
}

export interface NotMultipleOfIssue extends Issue {
  code: IssueCode.NOT_MULTIPLE_OF;
  divisor: number;
}

export interface NotMatchingIssue extends Issue {
  code: IssueCode.NOT_MATCHING;
  re: RegExp;
}

export interface NotLiteralIssue extends Issue {
  code: IssueCode.NOT_LITERAL;
  literal: Primitive;
}

export interface NotOneOfIssue extends Issue {
  code: IssueCode.NOT_ONE_OF;
  values: Primitive[];
}

export function createInvalidTypeIssue(
  context: ParserContext,
  expected: ValueType,
  received: ValueType,
  value: any
): InvalidTypeIssue {
  return { code: IssueCode.INVALID_TYPE, path: context.getPath(), value, expected, received };
}

export function createTooSmallIssue(
  context: ParserContext,
  type: ValueType,
  value: any,
  expected: number,
  received: number,
  inclusive = true
): TooSmallIssue {
  return { code: IssueCode.TOO_SMALL, path: context.getPath(), type, value, expected, received, inclusive };
}

export function createTooBigIssue(
  context: ParserContext,
  type: ValueType,
  value: any,
  expected: number,
  received: number,
  inclusive = true
): TooBigIssue {
  return { code: IssueCode.TOO_BIG, path: context.getPath(), type, value, expected, received, inclusive };
}
