/**
 * The module with the core Doubter functionality.
 *
 * ```ts
 * import * as d from 'doubter/core';
 * ```
 *
 * @module core
 */

import './plugin/array-essentials.js';
import './plugin/bigint-essentials.js';
import './plugin/date-essentials.js';
import './plugin/number-essentials.js';
import './plugin/object-essentials.js';
import './plugin/object-eval.js';
import './plugin/set-essentials.js';
import './plugin/string-essentials.js';

export type * from './plugin/array-essentials.js';
export type * from './plugin/bigint-essentials.js';
export type * from './plugin/date-essentials.js';
export type * from './plugin/number-essentials.js';
export type * from './plugin/object-essentials.js';
export type * from './plugin/set-essentials.js';
export type * from './plugin/string-essentials.js';

export * from './core.js';
