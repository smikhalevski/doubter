/**
 * The plugin that enhances {@linkcode doubter/core!Shape} with additional members.
 *
 * ```ts
 * import shapeHelpers from 'doubter/plugin/shape-helpers';
 *
 * shapeHelpers();
 * ```
 *
 * @module doubter/plugin/shape-helpers
 */

import { Shape } from '../core';

declare module '../core' {
  export interface Shape<InputValue, OutputValue> {
    /**
     * `true` if shape accepts `null` input values, or `false` otherwise.
     *
     * @group Plugin Properties
     * @plugin {@link doubter/plugin/shape-helpers!}
     */
    readonly isNullable: boolean;

    /**
     * `true` if shape accepts `undefined` input values, or `false` otherwise.
     *
     * @group Plugin Properties
     * @plugin {@link doubter/plugin/shape-helpers!}
     */
    readonly isOptional: boolean;

    /**
     * `true` if shape accepts both `null` and `undefined` input values, or `false` otherwise.
     *
     * @group Plugin Properties
     * @plugin {@link doubter/plugin/shape-helpers!}
     */
    readonly isNullish: boolean;
  }
}

/**
 * Enhances {@linkcode doubter/core!Shape} with additional members.
 */
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
