import { Type } from './types/Type';

export enum IssueCode {
  INVALID_TYPE = 'invalid_type',
  TOO_SMALL = 'too_small',
  TOO_BIG = 'too_big',
  NOT_MULTIPLE_OF = 'not_multiple_of',
  NOT_MATCHING = 'not_matching',
  NOT_LITERAL = 'not_literal',
  NOT_ONE_OF = 'not_one_of',
}

export enum ValueType {
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
