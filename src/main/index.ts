/**
 * The module with the core Doubter functionality.
 *
 * ```ts
 * import * as d from 'doubter/core';
 * ```
 *
 * @module doubter/core
 */

import enhanceArrayShape from './plugin/rich-arrays';
import enhanceBigIntShape from './plugin/rich-bigints';
import enhanceDateShape from './plugin/rich-dates';
import enhanceNumberShape from './plugin/rich-numbers';
import enhanceObjectShape from './plugin/rich-objects';
import enhanceSetShape from './plugin/rich-sets';
import enhanceStringShape from './plugin/rich-strings';
import { ArrayShape, BigIntShape, DateShape, NumberShape, ObjectShape, SetShape, StringShape } from './shape';

export type * from './plugin/rich-arrays';
export type * from './plugin/rich-bigints';
export type * from './plugin/rich-dates';
export type * from './plugin/rich-numbers';
export type * from './plugin/rich-objects';
export type * from './plugin/rich-sets';
export type * from './plugin/rich-strings';

export * from './core';

enhanceArrayShape(ArrayShape.prototype);
enhanceBigIntShape(BigIntShape.prototype);
enhanceDateShape(DateShape.prototype);
enhanceNumberShape(NumberShape.prototype);
enhanceObjectShape(ObjectShape.prototype);
enhanceSetShape(SetShape.prototype);
enhanceStringShape(StringShape.prototype);
