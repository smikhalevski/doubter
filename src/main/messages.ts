import { Any, Message } from './types';

/**
 * The mapping from an issue type to a corresponding issue message.
 */
export interface Messages {
  /**
   * @default "Must not be equal to %s"
   */
  'any.deny': Message | Any;

  /**
   * @default "Must not conform the excluded shape"
   */
  'any.exclude': Message | Any;

  /**
   * @default "Must conform the predicate"
   */
  'any.refine': Message | Any;

  /**
   * @default "Must not have unknown keys: %s"
   */
  'object.exact': Message | Any;

  /**
   * @default "Must be an array"
   */
  'type.array': Message | Any;

  /**
   * @default "Must be a bigint"
   */
  'type.bigint': Message | Any;

  /**
   * @default "Must be a boolean"
   */
  'type.boolean': Message | Any;

  /**
   * @default "Must be equal to %s"
   */
  'type.const': Message | Any;

  /**
   * @default "Must be a Date"
   */
  'type.date': Message | Any;

  /**
   * @default "Must be equal to one of %s"
   */
  'type.enum': Message | Any;

  /**
   * @default "Must be a function"
   */
  'type.function': Message | Any;

  /**
   * @default "Must be a class instance"
   */
  'type.instanceOf': Message | Any;

  /**
   * @default "Intersection results are incompatible"
   */
  'type.intersection': Message | Any;

  /**
   * @default "Must be a Map"
   */
  'type.map': Message | Any;

  /**
   * @default "Must not be used"
   */
  'type.never': Message | Any;

  /**
   * @default "Must be a number"
   */
  'type.number': Message | Any;

  /**
   * @default "Must be an object"
   */
  'type.object': Message | Any;

  /**
   * @default "Must be a Promise"
   */
  'type.promise': Message | Any;

  /**
   * @default "Must be a tuple of length %s"
   */
  'type.tuple': Message | Any;

  /**
   * @default "Must be a Set"
   */
  'type.set': Message | Any;

  /**
   * @default "Must be a string"
   */
  'type.string': Message | Any;

  /**
   * @default "Must be a symbol"
   */
  'type.symbol': Message | Any;

  /**
   * @default "Must conform the union"
   */
  'type.union': Message | Any;
}

export const defaultMessages = {
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
