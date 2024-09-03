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

export type * from './plugin/array-essentials';
export type * from './plugin/bigint-essentials';
export type * from './plugin/date-essentials';
export type * from './plugin/number-essentials';
export type * from './plugin/object-essentials';
export type * from './plugin/set-essentials';
export type * from './plugin/string-essentials';

export * from './core';
