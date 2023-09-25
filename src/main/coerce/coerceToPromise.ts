export function coerceToPromise(value: unknown): Promise<any> {
  return Promise.resolve(value);
}
