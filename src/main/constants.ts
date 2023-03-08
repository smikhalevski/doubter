export const ERROR_REQUIRES_ASYNC = 'Shape is async, use tryAsync, parseAsync, or parseOrDefaultAsync.';
export const ERROR_SHAPE_EXPECTED = 'Provider must return a shape. Are you accessing a lazy shape prematurely?';
export const ERROR_FUNCTION_WRAPPER_ASYNC = 'The function signature is constrained by async shapes, use wrapAsync.';

export const CODE_ARRAY_MIN = 'arrayMinLength';
export const CODE_ARRAY_MAX = 'arrayMaxLength';
export const CODE_CONST = 'const';
export const CODE_DENIED = 'denied';
export const CODE_ENUM = 'enum';
export const CODE_EXCLUDED = 'excluded';
export const CODE_INSTANCE = 'instance';
export const CODE_INTERSECTION = 'intersection';
export const CODE_PREDICATE = 'predicate';
export const CODE_NUMBER_INTEGER = 'numberInteger';
export const CODE_NUMBER_FINITE = 'numberFinite';
export const CODE_NUMBER_GT = 'numberGreaterThan';
export const CODE_NUMBER_GTE = 'numberGreaterThanOrEqual';
export const CODE_NUMBER_LT = 'numberLessThan';
export const CODE_NUMBER_LTE = 'numberLessThanOrEqual';
export const CODE_NUMBER_MULTIPLE_OF = 'numberMultipleOf';
export const CODE_SET_MIN = 'setMinSize';
export const CODE_SET_MAX = 'setMaxSize';
export const CODE_STRING_MIN = 'stringMinLength';
export const CODE_STRING_MAX = 'stringMaxLength';
export const CODE_STRING_REGEX = 'stringRegex';
export const CODE_TYPE = 'type';
export const CODE_TUPLE = 'tuple';
export const CODE_UNION = 'union';
export const CODE_UNKNOWN_KEYS = 'unknownKeys';

export const TYPE_ARRAY = 'array';
export const TYPE_BIGINT = 'bigint';
export const TYPE_BOOLEAN = 'boolean';
export const TYPE_DATE = 'date';
export const TYPE_FUNCTION = 'function';
export const TYPE_MAP = 'map';
export const TYPE_NEVER = 'never';
export const TYPE_NULL = 'null';
export const TYPE_NUMBER = 'number';
export const TYPE_OBJECT = 'object';
export const TYPE_PROMISE = 'promise';
export const TYPE_SET = 'set';
export const TYPE_STRING = 'string';
export const TYPE_SYMBOL = 'symbol';
export const TYPE_UNDEFINED = 'undefined';
export const TYPE_UNKNOWN = 'unknown';

export const MESSAGE_ARRAY_TYPE = 'Must be an array';
export const MESSAGE_ARRAY_MIN = 'Must have the minimum length of %s';
export const MESSAGE_ARRAY_MAX = 'Must have the maximum length of %s';
export const MESSAGE_SET_MIN = 'Must have the minimum size of %s';
export const MESSAGE_SET_MAX = 'Must have the maximum size of %s';
export const MESSAGE_BIGINT_TYPE = 'Must be a bigint';
export const MESSAGE_BOOLEAN_TYPE = 'Must be a boolean';
export const MESSAGE_CONST = 'Must be equal to %s';
export const MESSAGE_DATE_TYPE = 'Must be a Date';
export const MESSAGE_DENIED = 'Must not be equal to %s';
export const MESSAGE_ENUM = 'Must be equal to one of %s';
export const MESSAGE_EXCLUDED = 'Must not conform the excluded shape';
export const MESSAGE_FUNCTION_TYPE = 'Must be a function';
export const MESSAGE_INSTANCE = 'Must be a class instance';
export const MESSAGE_INTERSECTION = 'Intersection results are incompatible';
export const MESSAGE_PREDICATE = 'Must conform the predicate';
export const MESSAGE_MAP_TYPE = 'Must be a Map';
export const MESSAGE_NEVER_TYPE = 'Must not be used';
export const MESSAGE_NUMBER_TYPE = 'Must be a number';
export const MESSAGE_NUMBER_INTEGER = 'Must be an integer';
export const MESSAGE_NUMBER_FINITE = 'Must be an finite number';
export const MESSAGE_NUMBER_GT = 'Must be greater than %s';
export const MESSAGE_NUMBER_GTE = 'Must be greater than or equal to %s';
export const MESSAGE_NUMBER_LT = 'Must be less than %s';
export const MESSAGE_NUMBER_LTE = 'Must be less than or equal to %s';
export const MESSAGE_NUMBER_MULTIPLE_OF = 'Must be a multiple of %s';
export const MESSAGE_OBJECT_TYPE = 'Must be an object';
export const MESSAGE_PROMISE_TYPE = 'Must be a Promise';
export const MESSAGE_SET_TYPE = 'Must be a Set';
export const MESSAGE_STRING_TYPE = 'Must be a string';
export const MESSAGE_STRING_MIN = 'Must have the minimum length of %s';
export const MESSAGE_STRING_MAX = 'Must have the maximum length of %s';
export const MESSAGE_STRING_REGEX = 'Must match the pattern %s';
export const MESSAGE_SYMBOL_TYPE = 'Must be a symbol';
export const MESSAGE_TUPLE = 'Must be a tuple of length %s';
export const MESSAGE_UNION = 'Must conform the union';
export const MESSAGE_UNKNOWN_KEYS = 'Must not have unknown keys: %s';
