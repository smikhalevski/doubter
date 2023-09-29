import { TYPE_PROMISE } from '../Type';

export const promiseTypes: unknown[] = [TYPE_PROMISE];

/**
 * The list of types that are coercible to Promise with {@link coerceToBoolean}.
 */
export function coerceToPromise(value: unknown): Promise<any> {
  return Promise.resolve(value);
}
