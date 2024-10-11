/**
 * The marker object that is used to denote an impossible value.
 *
 * For example, {@link NEVER} is returned from {@link CoercibleShape._coerce} when coercion is not possible.
 *
 * @group Other
 */
export const NEVER = Object.freeze({} as never);

export function coerceToNever(_value: unknown): never {
  return NEVER;
}
