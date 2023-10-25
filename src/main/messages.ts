import { Any, Message } from './typings';

/**
 * The mapping from an issue type to a corresponding issue message.
 */
export interface Messages {
  'any.deny': Message | Any;
  'any.exclude': Message | Any;
  'any.refine': Message | Any;
  'object.exact': Message | Any;
  'type.array': Message | Any;
  'type.bigint': Message | Any;
  'type.boolean': Message | Any;
  'type.const': Message | Any;
  'type.date': Message | Any;
  'type.enum': Message | Any;
  'type.function': Message | Any;
  'type.instanceOf': Message | Any;
  'type.intersection': Message | Any;
  'type.map': Message | Any;
  'type.never': Message | Any;
  'type.number': Message | Any;
  'type.object': Message | Any;
  'type.promise': Message | Any;
  'type.tuple': Message | Any;
  'type.set': Message | Any;
  'type.string': Message | Any;
  'type.symbol': Message | Any;
  'type.union': Message | Any;
}

export const globalMessages = {
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
} satisfies Partial<Messages> as Messages;
