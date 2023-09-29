/**
 * The list of types that are coercible to Promise with {@link coerceToBoolean}.
 */
export function coerceToPromise(value: unknown): Promise<any> {
  return Promise.resolve(value);
}
