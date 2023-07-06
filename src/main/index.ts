/**
 * The module with the core Doubter functionality.
 *
 * ```ts
 * import * as d from 'doubter/core';
 * ```
 *
 * @module doubter/core
 */

import arrayChecks from './plugin/array-checks';
import bigintChecks from './plugin/bigint-checks';
import dateChecks from './plugin/date-checks';
import numberChecks from './plugin/number-checks';
import objectChecks from './plugin/object-checks';
import setChecks from './plugin/set-checks';
import stringChecks from './plugin/string-checks';

export type * from './plugin/array-checks';
export type * from './plugin/bigint-checks';
export type * from './plugin/date-checks';
export type * from './plugin/number-checks';
export type * from './plugin/object-checks';
export type * from './plugin/set-checks';
export type * from './plugin/string-checks';

export * from './core';

arrayChecks();
bigintChecks();
dateChecks();
numberChecks();
objectChecks();
setChecks();
stringChecks();
