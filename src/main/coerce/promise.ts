/**
 * The list of types that are coercible to Promise with {@link coerceToBoolean}.
 */
export function coerceToPromise(input: unknown): Promise<any> {
  return Promise.resolve(input);
}
