/**
 * The plugin that enhances {@link core!ObjectShape ObjectShape} with additional methods.
 *
 * ```ts
 * import { ObjectShape } from 'doubter/core';
 * import enableObjectEssentials from 'doubter/plugin/object-essentials';
 *
 * enableObjectEssentials(ObjectShape);
 * ```
 *
 * @module plugin/object-essentials
 */

import { ReadonlyDict } from '../internal/objects';
import { ObjectShape } from '../shape/ObjectShape';
import { AnyShape } from '../shape/Shape';
import { IssueOptions, Message } from '../types';
import { enableObjectLikeEssentials } from './object-utils';

declare module '../core' {
  export interface ObjectShape<PropShapes extends ReadonlyDict<AnyShape>, RestShape extends AnyShape | null> {
    /**
     * Constrains an object to have a `null` or {@link !Object} prototype.
     *
     * @param options The issue options or the issue message.
     * @returns The clone of the shape.
     * @group Plugin Methods
     * @plugin {@link plugin/object-essentials! plugin/object-essentials}
     */
    plain(options?: IssueOptions | Message): this;

    /**
     * Defines an all-or-nothing relationship between keys where if one of the keys is present, all of them are
     * required as well.
     *
     * @param keys The keys of which, if one present, all are required.
     * @param options The issue options or the issue message.
     * @returns The clone of the shape.
     * @group Plugin Methods
     * @plugin {@link plugin/object-essentials! plugin/object-essentials}
     */
    allKeys(keys: ReadonlyArray<keyof PropShapes>, options?: IssueOptions | Message): this;

    /**
     * Defines a relationship between keys where not all peers can be present at the same time.
     *
     * @param keys The keys of which, if one present, the others may not all be present.
     * @param options The issue options or the issue message.
     * @returns The clone of the shape.
     * @group Plugin Methods
     * @plugin {@link plugin/object-essentials! plugin/object-essentials}
     */
    notAllKeys(keys: ReadonlyArray<keyof PropShapes>, options?: IssueOptions | Message): this;

    /**
     * Defines a relationship between keys where at least one of the keys is required (and more than one is allowed).
     *
     * @param keys The keys of which at least one must appear.
     * @param options The issue options or the issue message.
     * @returns The clone of the shape.
     * @group Plugin Methods
     * @plugin {@link plugin/object-essentials! plugin/object-essentials}
     */
    orKeys(keys: ReadonlyArray<keyof PropShapes>, options?: IssueOptions | Message): this;

    /**
     * Defines an exclusive relationship between a set of keys where one of them is required but not at the same time.
     *
     * @param keys The exclusive keys that must not appear together but where one of them is required.
     * @param options The issue options or the issue message.
     * @returns The clone of the shape.
     * @group Plugin Methods
     * @plugin {@link plugin/object-essentials! plugin/object-essentials}
     */
    xorKeys(keys: ReadonlyArray<keyof PropShapes>, options?: IssueOptions | Message): this;

    /**
     * Defines an exclusive relationship between a set of keys where only one is allowed but none are required.
     *
     * @param keys The exclusive keys that must not appear together but where none are required.
     * @param options The issue options or the issue message.
     * @returns The clone of the shape.
     * @group Plugin Methods
     * @plugin {@link plugin/object-essentials! plugin/object-essentials}
     */
    oxorKeys(keys: ReadonlyArray<keyof PropShapes>, options?: IssueOptions | Message): this;
  }
}

/**
 * Enhances {@link core!ObjectShape ObjectShape} with additional methods.
 */
export default function enableObjectEssentials(ctor: typeof ObjectShape): void {
  enableObjectLikeEssentials(ctor);
}
