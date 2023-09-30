export interface Messages {
  'any.deny': any;
  'any.exclude': any;
  'any.refine': any;
  'array.includes': any;
  'array.max': any;
  'array.min': any;
  'bigint.min': any;
  'bigint.max': any;
  'date.min': any;
  'date.max': any;
  'number.finite': any;
  'number.int': any;
  'number.gt': any;
  'number.gte': any;
  'number.lt': any;
  'number.lte': any;
  'number.multipleOf': any;
  'object.allKeys': any;
  'object.notAllKeys': any;
  'object.orKeys': any;
  'object.xorKeys': any;
  'object.oxorKeys': any;
  'object.exact': any;
  'object.plain': any;
  'set.min': any;
  'set.max': any;
  'string.nonBlank': any;
  'string.min': any;
  'string.max': any;
  'string.regex': any;
  'string.includes': any;
  'string.startsWith': any;
  'string.endsWith': any;
  'type.array': any;
  'type.bigint': any;
  'type.boolean': any;
  'type.const': any;
  'type.date': any;
  'type.enum': any;
  'type.function': any;
  'type.instanceOf': any;
  'type.intersection': any;
  'type.map': any;
  'type.never': any;
  'type.number': any;
  'type.object': any;
  'type.promise': any;
  'type.tuple': any;
  'type.set': any;
  'type.string': any;
  'type.symbol': any;
  'type.union': any;
}

export const messages: Messages = {
  'any.deny': 'Must not be equal to %s',
  'any.exclude': 'Must not conform the excluded shape',
  'any.refine': 'Must conform the predicate',
  'array.includes': 'Must include a value',
  'array.max': 'Must have the maximum length of %s',
  'array.min': 'Must have the minimum length of %s',
  'bigint.min': 'Must be greater than or equal to %s',
  'bigint.max': 'Must be less than or equal to %s',
  'date.min': 'Must be after %s',
  'date.max': 'Must be before %s',
  'number.finite': 'Must be a finite number',
  'number.int': 'Must be an integer',
  'number.gt': 'Must be greater than %s',
  'number.gte': 'Must be greater than or equal to %s',
  'number.lt': 'Must be less than %s',
  'number.lte': 'Must be less than or equal to %s',
  'number.multipleOf': 'Must be a multiple of %s',
  'object.allKeys': 'Must contain all or no keys: %s',
  'object.notAllKeys': 'Must contain not all or no keys: %s',
  'object.orKeys': 'Must contain at least one key: %s',
  'object.xorKeys': 'Must contain exactly one key: %s',
  'object.oxorKeys': 'Must contain one or no keys: %s',
  'object.exact': 'Must not have unknown keys: %s',
  'object.plain': 'Must be a plain object',
  'set.min': 'Must have the minimum size of %s',
  'set.max': 'Must have the maximum size of %s',
  'string.nonBlank': 'Must not be blank',
  'string.min': 'Must have the minimum length of %s',
  'string.max': 'Must have the maximum length of %s',
  'string.regex': 'Must match the pattern %s',
  'string.includes': 'Must include: %s',
  'string.startsWith': 'Must start with: %s',
  'string.endsWith': 'Must end with: %s',
  'type.array': 'Must be an array',
  'type.bigint': 'Must be a bigint',
  'type.boolean': 'Must be a boolean',
  'type.const': 'Must be equal to %s',
  'type.date': 'Must be a Date',
  'type.enum': 'Must be equal to one of %s',
  'type.function': 'Must be a function',
  'type.instanceOf': 'Must be a class instance',
  'type.intersection': 'Intersection results are incompatible',
  'type.map': 'Must be a Map',
  'type.never': 'Must not be used',
  'type.number': 'Must be a number',
  'type.object': 'Must be an object',
  'type.promise': 'Must be a Promise',
  'type.tuple': 'Must be a tuple of length %s',
  'type.set': 'Must be a Set',
  'type.string': 'Must be a string',
  'type.symbol': 'Must be a symbol',
  'type.union': 'Must conform the union',
};
