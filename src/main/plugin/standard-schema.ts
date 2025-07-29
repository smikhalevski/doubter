/**
 * The plugin that enables [Standard Schema](https://github.com/standard-schema/standard-schema#readme) support.
 *
 * ```ts
 * import * as d from 'doubter/core';
 * import 'doubter/plugin/standard-schema';
 *
 * d.array()['~standard'].validate(['hello']);
 * ```
 *
 * @module plugin/standard-schema
 */

import { defineReadonlyProperty } from '../internal/objects.js';
import { Shape } from '../shape/Shape.js';
import { StandardSchemaV1 } from '../vendor/standard-schema.js';

declare module '../core.js' {
  export interface Shape<InputValue, OutputValue> extends StandardSchemaV1<InputValue, OutputValue> {
    /**
     * The Standard Schema properties.
     *
     * @plugin {@link plugin/standard-schema! plugin/standard-schema}
     */
    readonly '~standard': StandardSchemaV1.Props<InputValue, OutputValue>;
  }
}

Object.defineProperty(Shape.prototype, '~standard', {
  get(this: Shape) {
    return defineReadonlyProperty(this, '~standard', {
      vendor: 'doubter',
      version: 1,
      validate: this.isAsync ? this.tryAsync : this.try,
    });
  },
});
