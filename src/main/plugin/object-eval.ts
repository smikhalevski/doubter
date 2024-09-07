/**
 * The plugin that enables runtime optimization of {@link core!ObjectShape ObjectShape}. Object shapes would dynamically
 * compile code fragments to increase runtime performance.
 *
 * ```ts
 * import { ObjectShape } from 'doubter/core';
 * import enableObjectEval from 'doubter/plugin/object-eval';
 *
 * enableObjectEval(ObjectShape);
 * ```
 *
 * @module plugin/object-eval
 */

import { cloneObject, defineReadonlyProperty, setProperty } from '../internal/objects';
import { concatIssues, unshiftIssuesPath } from '../internal/shapes';
import { ObjectShape } from '../shape/ObjectShape';

/**
 * Enables runtime optimization of {@link core!ObjectShape ObjectShape}. Object shapes would dynamically compile code
 * fragments to increase runtime performance.
 *
 * @alpha
 */
export default function enableObjectEval(ctor: typeof ObjectShape): void {
  try {
    new Function('');
  } catch {
    // Code evaluation isn't supported
    return;
  }

  Object.defineProperty(ctor.prototype, '_applyRestUnchecked', {
    configurable: true,

    get() {
      return defineReadonlyProperty(this, '_applyRestUnchecked', compileApplyRestUnchecked(this));
    },
  });
}

function compileApplyRestUnchecked(shape: ObjectShape<any, any>) {
  let source = 'return function(input, options, nonce) { var issues = null, output = input, result;';

  for (const key in shape.propShapes) {
    const keyStr = JSON.stringify(key);

    source +=
      'if ((result = shape.propShapes[' +
      keyStr +
      ']._apply(input[' +
      keyStr +
      '], options, nonce)) !== null)' +
      'if (Array.isArray(result)) {' +
      'unshiftIssuesPath(result, ' +
      keyStr +
      ');' +
      'if (options.earlyReturn) return result;' +
      'issues = concatIssues(issues, result);' +
      '} else if (issues === null || shape.operations.length !== 0)' +
      'setProperty(input === output ? output = cloneObject(input) : output, ' +
      keyStr +
      ', result.value);';
  }

  source += 'return shape._applyOperations(input, output, options, issues)}';

  const factory = new Function('shape', 'unshiftIssuesPath', 'concatIssues', 'cloneObject', 'setProperty', source);

  return factory(shape, unshiftIssuesPath, concatIssues, cloneObject, setProperty);
}
