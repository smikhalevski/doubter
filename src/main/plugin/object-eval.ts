/**
 * The plugin that enables runtime optimization of {@link core!ObjectShape ObjectShape}. Object shapes would dynamically
 * compile code fragments to increase runtime performance.
 *
 * ```ts
 * import * as d from 'doubter/core';
 * import 'doubter/plugin/object-eval';
 *
 * d.object({ foo: d.string() }).plain();
 * ```
 *
 * @module plugin/object-eval
 */

import { cloneObject, defineReadonlyProperty, setProperty } from '../internal/objects';
import { concatIssues, unshiftIssuesPath } from '../internal/shapes';
import { ObjectShape } from '../shape/ObjectShape';

try {
  // Assert code evaluation support
  new Function('');

  Object.defineProperty(ObjectShape.prototype, '_applyRestUnchecked', {
    configurable: true,

    get() {
      return defineReadonlyProperty(this, '_applyRestUnchecked', compileApplyRestUnchecked(this));
    },
  });
} catch {
  // Code evaluation isn't supported
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
