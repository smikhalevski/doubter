/**
 * The module with the core Doubter functionality.
 *
 * ```ts
 * import * as d from 'doubter/core';
 * ```
 *
 * @module core
 */

import enableArrayEssentials from './plugin/array-essentials';
import enableBigIntEssentials from './plugin/bigint-essentials';
import enableDateEssentials from './plugin/date-essentials';
import enableNumberEssentials from './plugin/number-essentials';
import enableObjectEssentials from './plugin/object-essentials';
import enableSetEssentials from './plugin/set-essentials';
import enableStringEssentials from './plugin/string-essentials';
import { ArrayShape, BigIntShape, DateShape, NumberShape, ObjectShape, SetShape, StringShape } from './core';

export type * from './plugin/array-essentials';
export type * from './plugin/bigint-essentials';
export type * from './plugin/date-essentials';
export type * from './plugin/number-essentials';
export type * from './plugin/object-essentials';
export type * from './plugin/set-essentials';
export type * from './plugin/string-essentials';

export * from './core';

enableArrayEssentials(ArrayShape);
enableBigIntEssentials(BigIntShape);
enableDateEssentials(DateShape);
enableNumberEssentials(NumberShape);
enableObjectEssentials(ObjectShape);
enableSetEssentials(SetShape);
enableStringEssentials(StringShape);
