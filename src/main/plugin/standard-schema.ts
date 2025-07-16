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

      validate: (input: unknown) => {
        // Doubter doesn't constrain validation issue message type, while standard schema requires every issue to have
        // a _string_ message. By default, all issues produced by Doubter built-in plugins have string messages. So it's
        // safe to assume full runtime compatibility up to the point where custom non-string messages are used.
        return this.isAsync ? this.tryAsync(input) : this.try(input);
      },
    });
  },
});
