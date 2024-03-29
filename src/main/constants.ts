export const ERR_SYNC_UNSUPPORTED = 'Shape is async, use tryAsync, parseAsync, or parseOrDefaultAsync.';
export const ERR_SHAPE_EXPECTED = 'Provider must return a shape. Are you accessing a lazy shape prematurely?';
export const ERR_ASYNC_FUNCTION = 'The function signature is constrained by async shapes, use ensureAsync.';

export const CODE_ANY_DENY = 'any.deny';
export const CODE_ANY_EXCLUDE = 'any.exclude';
export const CODE_ANY_REFINE = 'any.refine';
export const CODE_ARRAY_INCLUDES = 'array.includes';
export const CODE_ARRAY_MIN = 'array.min';
export const CODE_ARRAY_MAX = 'array.max';
export const CODE_BIGINT_MIN = 'bigint.min';
export const CODE_BIGINT_MAX = 'bigint.max';
export const CODE_DATE_MIN = 'date.min';
export const CODE_DATE_MAX = 'date.max';
export const CODE_NUMBER_FINITE = 'number.finite';
export const CODE_NUMBER_INT = 'number.int';
export const CODE_NUMBER_GT = 'number.gt';
export const CODE_NUMBER_GTE = 'number.gte';
export const CODE_NUMBER_LT = 'number.lt';
export const CODE_NUMBER_LTE = 'number.lte';
export const CODE_NUMBER_MULTIPLE_OF = 'number.multipleOf';
export const CODE_OBJECT_ALL_KEYS = 'object.allKeys';
export const CODE_OBJECT_NOT_ALL_KEYS = 'object.notAllKeys';
export const CODE_OBJECT_OR_KEYS = 'object.orKeys';
export const CODE_OBJECT_XOR_KEYS = 'object.xorKeys';
export const CODE_OBJECT_OXOR_KEYS = 'object.oxorKeys';
export const CODE_OBJECT_EXACT = 'object.exact';
export const CODE_OBJECT_PLAIN = 'object.plain';
export const CODE_SET_MIN = 'set.min';
export const CODE_SET_MAX = 'set.max';
export const CODE_STRING_NON_BLANK = 'string.nonBlank';
export const CODE_STRING_MIN = 'string.min';
export const CODE_STRING_MAX = 'string.max';
export const CODE_STRING_REGEX = 'string.regex';
export const CODE_STRING_INCLUDES = 'string.includes';
export const CODE_STRING_STARTS_WITH = 'string.startsWith';
export const CODE_STRING_ENDS_WITH = 'string.endsWith';
export const CODE_TYPE = 'type';
export const CODE_TYPE_CONST = 'type.const';
export const CODE_TYPE_ENUM = 'type.enum';
export const CODE_TYPE_INSTANCE_OF = 'type.instanceOf';
export const CODE_TYPE_INTERSECTION = 'type.intersection';
export const CODE_TYPE_NEVER = 'type.never';
export const CODE_TYPE_TUPLE = 'type.tuple';
export const CODE_TYPE_UNION = 'type.union';
