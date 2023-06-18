/**
 * @module doubter/plugin/shape-helpers
 */

import { Shape } from '../core';

declare module '../core' {
  export interface Shape<InputValue, OutputValue> {
    /**
     * `true` if shape accepts `null` input values, or `false` otherwise.
     *
     * @group Plugin Properties
     * @plugin [doubter/plugin/shape-helpers](https://github.com/smikhalevski/doubter/modules/doubter_plugin_shape_helpers.html)
     */
    readonly isNullable: boolean;

    /**
     * `true` if shape accepts `undefined` input values, or `false` otherwise.
     *
     * @group Plugin Properties
     * @plugin [doubter/plugin/shape-helpers](https://github.com/smikhalevski/doubter/modules/doubter_plugin_shape_helpers.html)
     */
    readonly isOptional: boolean;

    /**
     * `true` if shape accepts both `null` and `undefined` input values, or `false` otherwise.
     *
     * @group Plugin Properties
     * @plugin [doubter/plugin/shape-helpers](https://github.com/smikhalevski/doubter/modules/doubter_plugin_shape_helpers.html)
     */
    readonly isNullish: boolean;
  }
}

export default function () {
  Object.defineProperties(Shape.prototype, {
    isNullable: {
      configurable: true,
      get(this: Shape) {
        return this.accepts(null);
      },
    },

    isOptional: {
      configurable: true,
      get(this: Shape) {
        return this.accepts(undefined);
      },
    },

    isNullish: {
      configurable: true,
      get(this: Shape) {
        return this.isNullable && this.isOptional;
      },
    },
  });
}
