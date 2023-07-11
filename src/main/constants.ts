export const ERR_SYNC_UNSUPPORTED = 'Shape is async, use tryAsync, parseAsync, or parseOrDefaultAsync.';
export const ERR_SYNC_REQUIRED = 'Shape cannot be used because it is async.';
export const ERR_SHAPE_EXPECTED = 'Provider must return a shape. Are you accessing a lazy shape prematurely?';
export const ERR_ASYNC_FUNCTION = 'The function signature is constrained by async shapes, use ensureAsyncSignature.';

export const OP_STRING_TRIM = 'string_trim';
export const OP_STRING_LOWER = 'string_lower';
export const OP_STRING_UPPER = 'string_upper';

export const CODE_ARRAY_INCLUDES = 'array_includes';
export const CODE_ARRAY_MIN = 'array_min';
export const CODE_ARRAY_MAX = 'array_max';
export const CODE_BIGINT_MIN = 'bigint_min';
export const CODE_BIGINT_MAX = 'bigint_max';
export const CODE_CONST = 'const';
export const CODE_DENIED = 'denied';
export const CODE_DATE_MIN = 'date_min';
export const CODE_DATE_MAX = 'date_max';
export const CODE_ENUM = 'enum';
export const CODE_EXCLUDED = 'excluded';
export const CODE_INSTANCE = 'instance';
export const CODE_INTERSECTION = 'intersection';
export const CODE_PREDICATE = 'predicate';
export const CODE_NEVER = 'never';
export const CODE_NUMBER_INTEGER = 'number_integer';
export const CODE_NUMBER_FINITE = 'number_finite';
export const CODE_NUMBER_GT = 'number_gt';
export const CODE_NUMBER_LT = 'number_lt';
export const CODE_NUMBER_GTE = 'number_gte';
export const CODE_NUMBER_LTE = 'number_lte';
export const CODE_NUMBER_MULTIPLE = 'number_multiple';
export const CODE_OBJECT_ALL_KEYS = 'object_all_keys';
export const CODE_OBJECT_NOT_ALL_KEYS = 'object_not_all_keys';
export const CODE_OBJECT_OR_KEYS = 'object_or_keys';
export const CODE_OBJECT_XOR_KEYS = 'object_xor_keys';
export const CODE_OBJECT_OXOR_KEYS = 'object_oxor_keys';
export const CODE_OBJECT_EXACT = 'object_exact';
export const CODE_OBJECT_PLAIN = 'object_plain';
export const CODE_SET_MIN = 'set_min';
export const CODE_SET_MAX = 'set_max';
export const CODE_STRING_BLANK = 'string_blank';
export const CODE_STRING_MIN = 'string_min';
export const CODE_STRING_MAX = 'string_max';
export const CODE_STRING_REGEX = 'string_regex';
export const CODE_STRING_INCLUDES = 'string_includes';
export const CODE_STRING_STARTS_WITH = 'string_starts_with';
export const CODE_STRING_ENDS_WITH = 'string_ends_with';
export const CODE_TYPE = 'type';
export const CODE_TUPLE = 'tuple';
export const CODE_UNION = 'union';

export const MESSAGE_ARRAY_INCLUDES = 'Must include a value';
export const MESSAGE_ARRAY_TYPE = 'Must be an array';
export const MESSAGE_ARRAY_MIN = 'Must have the minimum length of %s';
export const MESSAGE_ARRAY_MAX = 'Must have the maximum length of %s';
export const MESSAGE_BIGINT_MIN = 'Must be greater than or equal to %s';
export const MESSAGE_BIGINT_MAX = 'Must be less than or equal to %s';
export const MESSAGE_BIGINT_TYPE = 'Must be a bigint';
export const MESSAGE_BOOLEAN_TYPE = 'Must be a boolean';
export const MESSAGE_CONST = 'Must be equal to %s';
export const MESSAGE_DATE_TYPE = 'Must be a Date';
export const MESSAGE_DENIED = 'Must not be equal to %s';
export const MESSAGE_DATE_MIN = 'Must be after %s';
export const MESSAGE_DATE_MAX = 'Must be before %s';
export const MESSAGE_ENUM = 'Must be equal to one of %s';
export const MESSAGE_EXCLUDED = 'Must not conform the excluded shape';
export const MESSAGE_FUNCTION_TYPE = 'Must be a function';
export const MESSAGE_INSTANCE = 'Must be a class instance';
export const MESSAGE_INTERSECTION = 'Intersection results are incompatible';
export const MESSAGE_MAP_TYPE = 'Must be a Map';
export const MESSAGE_NEVER = 'Must not be used';
export const MESSAGE_NUMBER_TYPE = 'Must be a number';
export const MESSAGE_NUMBER_INTEGER = 'Must be an integer';
export const MESSAGE_NUMBER_FINITE = 'Must be a finite number';
export const MESSAGE_NUMBER_GT = 'Must be greater than %s';
export const MESSAGE_NUMBER_GTE = 'Must be greater than or equal to %s';
export const MESSAGE_NUMBER_LT = 'Must be less than %s';
export const MESSAGE_NUMBER_LTE = 'Must be less than or equal to %s';
export const MESSAGE_NUMBER_MULTIPLE = 'Must be a multiple of %s';
export const MESSAGE_OBJECT_TYPE = 'Must be an object';
export const MESSAGE_OBJECT_ALL_KEYS = 'Must contain all or no keys: %s';
export const MESSAGE_OBJECT_NOT_ALL_KEYS = 'Must contain not all or no keys: %s';
export const MESSAGE_OBJECT_OR_KEYS = 'Must contain at least one key: %s';
export const MESSAGE_OBJECT_XOR_KEYS = 'Must contain exactly one key: %s';
export const MESSAGE_OBJECT_OXOR_KEYS = 'Must contain one or no keys: %s';
export const MESSAGE_OBJECT_EXACT = 'Must not have unknown keys: %s';
export const MESSAGE_OBJECT_PLAIN = 'Must be a plain object';
export const MESSAGE_PREDICATE = 'Must conform the predicate';
export const MESSAGE_PROMISE_TYPE = 'Must be a Promise';
export const MESSAGE_SET_TYPE = 'Must be a Set';
export const MESSAGE_SET_MIN = 'Must have the minimum size of %s';
export const MESSAGE_SET_MAX = 'Must have the maximum size of %s';
export const MESSAGE_STRING_TYPE = 'Must be a string';
export const MESSAGE_STRING_BLANK = 'Must not be blank';
export const MESSAGE_STRING_MIN = 'Must have the minimum length of %s';
export const MESSAGE_STRING_MAX = 'Must have the maximum length of %s';
export const MESSAGE_STRING_REGEX = 'Must match the pattern %s';
export const MESSAGE_STRING_INCLUDES = 'Must include: %s';
export const MESSAGE_STRING_STARTS_WITH = 'Must start with: %s';
export const MESSAGE_STRING_ENDS_WITH = 'Must end with: %s';
export const MESSAGE_SYMBOL_TYPE = 'Must be a symbol';
export const MESSAGE_TUPLE = 'Must be a tuple of length %s';
export const MESSAGE_UNION = 'Must conform the union';
