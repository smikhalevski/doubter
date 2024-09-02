/**
 * `true` if runtime code evaluation is supported.
 *
 * @alpha
 */
export const isEvalSupported = (() => {
  try {
    new Function('');
    return true;
  } catch {
    return false;
  }
})();
