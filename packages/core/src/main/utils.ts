import { Type } from './types/Type';
import { ParserContext } from './ParserContext';
import { Issue } from './shared-types';

export const enum IssueCode {
  INVALID_TYPE,
  ARRAY_TOO_SHORT,
  ARRAY_TOO_LONG,
  NUMBER_TOO_SMALL_INCLUSIVE,
  NUMBER_TOO_BIG_INCLUSIVE,
  NUMBER_TOO_SMALL,
  NUMBER_TOO_BIG,
  NUMBER_NOT_MULTIPLE_OF,
  STRING_TOO_SHORT,
  STRING_TOO_LONG,
  STRING_NO_MATCH,
  TUPLE_INVALID_LENGTH,
  NOT_LITERAL,
  NOT_ONE_OF,
}

export const enum ValueType {
  STRING = 'string',
  NAN = 'nan',
  NUMBER = 'number',
  INTEGER = 'integer',
  BOOLEAN = 'boolean',
  DATE = 'date',
  BIGINT = 'bigint',
  FUNCTION = 'function',
  UNDEFINED = 'undefined',
  NULL = 'null',
  ARRAY = 'array',
  OBJECT = 'object',
  UNKNOWN = 'unknown',
  PROMISE = 'promise',
  MAP = 'map',
  SET = 'set',
}

export function isAsync(types: Type[]): boolean {
  let async = false;

  for (let i = 0; i < types.length && !async; ++i) {
    async = types[i].async;
  }
  return async;
}

export function getValueType(value: unknown): ValueType {
  switch (typeof value) {
    case 'undefined':
      return ValueType.UNDEFINED;

    case 'string':
      return ValueType.STRING;

    case 'number':
      if (isNaN(value)) {
        return ValueType.NAN;
      }
      if (Number.isInteger(value)) {
        return ValueType.INTEGER;
      }
      return ValueType.NUMBER;

    case 'boolean':
      return ValueType.BOOLEAN;

    case 'function':
      return ValueType.FUNCTION;

    case 'bigint':
      return ValueType.BIGINT;

    case 'object':
      if (value === null) {
        return ValueType.NULL;
      }
      if (Array.isArray(value)) {
        return ValueType.ARRAY;
      }
      return ValueType.OBJECT;

    default:
      return ValueType.UNKNOWN;
  }
}

export function createIssue(context: ParserContext, code: IssueCode, value: any, param?: any): Issue {
  return { code, path: context.getPath(), value, valueType: getValueType(value), param };
}
