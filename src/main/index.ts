/**
 * The module with the core Doubter functionality.
 *
 * ```ts
 * import * as d from 'doubter/core';
 * ```
 *
 * @module core
 */

import './plugin/array-essentials';
import './plugin/bigint-essentials';
import './plugin/date-essentials';
import './plugin/number-essentials';
import './plugin/object-essentials';
import './plugin/object-eval';
import './plugin/set-essentials';
import './plugin/string-essentials';

export type * from './plugin/array-essentials.js';
export type * from './plugin/bigint-essentials.js';
export type * from './plugin/date-essentials.js';
export type * from './plugin/number-essentials.js';
export type * from './plugin/object-essentials.js';
export type * from './plugin/set-essentials.js';
export type * from './plugin/string-essentials.js';

export * from './core.js';
