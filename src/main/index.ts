/**
 * @module doubter/core
 */

import arrayChecks from './plugin/array-checks';
import bigintChecks from './plugin/bigint-checks';
import dateChecks from './plugin/date-checks';
import numberChecks from './plugin/number-checks';
import setChecks from './plugin/set-checks';
import shapeHelpers from './plugin/shape-helpers';
import stringChecks from './plugin/string-checks';

export * from './plugin/array-checks';
export * from './plugin/bigint-checks';
export * from './plugin/date-checks';
export * from './plugin/number-checks';
export * from './plugin/set-checks';
export * from './plugin/shape-helpers';
export * from './plugin/string-checks';
export * from './core';

arrayChecks();
bigintChecks();
dateChecks();
numberChecks();
setChecks();
shapeHelpers();
stringChecks();
