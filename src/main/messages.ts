export interface Messages {
  'any.deny': any;
  'any.exclude': any;
  'any.refine': any;
  'object.exact': any;
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

export const messages: Partial<Messages> = {
  'any.deny': 'Must not be equal to %s',
  'any.exclude': 'Must not conform the excluded shape',
  'any.refine': 'Must conform the predicate',
  'object.exact': 'Must not have unknown keys: %s',
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
