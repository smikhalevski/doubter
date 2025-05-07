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

export type * from './plugin/array-essentials.ts';
export type * from './plugin/bigint-essentials.ts';
export type * from './plugin/date-essentials.ts';
export type * from './plugin/number-essentials.ts';
export type * from './plugin/object-essentials.ts';
export type * from './plugin/set-essentials.ts';
export type * from './plugin/string-essentials.ts';

export * from './core.ts';
