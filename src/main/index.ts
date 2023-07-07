/**
 * The module with the core Doubter functionality.
 *
 * ```ts
 * import * as d from 'doubter/core';
 * ```
 *
 * @module doubter/core
 */

import pluginRichArrays from './plugin/rich-arrays';
import pluginRichBigInts from './plugin/rich-bigints';
import pluginRichDates from './plugin/rich-dates';
import pluginRichNumbers from './plugin/rich-numbers';
import pluginRichObjects from './plugin/rich-objects';
import pluginRichSets from './plugin/rich-sets';
import pluginRichStrings from './plugin/rich-strings';

export type * from './plugin/rich-arrays';
export type * from './plugin/rich-bigints';
export type * from './plugin/rich-dates';
export type * from './plugin/rich-numbers';
export type * from './plugin/rich-objects';
export type * from './plugin/rich-sets';
export type * from './plugin/rich-strings';

export * from './core';

pluginRichArrays();
pluginRichBigInts();
pluginRichDates();
pluginRichNumbers();
pluginRichObjects();
pluginRichSets();
pluginRichStrings();
