/**
 * The plugin that enhances {@link core!RecordShape RecordShape} with additional methods.
 *
 * ```ts
 * import { RecordShape } from 'doubter/core';
 * import enableRecordEssentials from 'doubter/plugin/record-essentials';
 *
 * enableRecordEssentials(RecordShape);
 * ```
 *
 * @module plugin/record-essentials
 */

import { RecordShape } from '../shape/RecordShape';
import { AnyShape, Input, Shape } from '../shape/Shape';
import { IssueOptions, Message } from '../types';
import { enableObjectLikeEssentials } from './object-utils';

declare module '../core' {
  export class RecordShape<KeyShape extends Shape<string, PropertyKey> | null, ValueShape extends AnyShape> {
    /**
     * Constrains an object to have a `null` or {@link !Object Object} prototype.
     *
     * @param options The issue options or the issue message.
     * @returns The clone of the shape.
     * @group Plugin Methods
     * @plugin {@link plugin/record-essentials! plugin/record-essentials}
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
     * @plugin {@link plugin/record-essentials! plugin/record-essentials}
     */
    allKeys(keys: ReadonlyArray<Input<NonNullable<KeyShape>>>, options?: IssueOptions | Message): this;

    /**
     * Defines a relationship between keys where not all peers can be present at the same time.
     *
     * @param keys The keys of which, if one present, the others may not all be present.
     * @param options The issue options or the issue message.
     * @returns The clone of the shape.
     * @group Plugin Methods
     * @plugin {@link plugin/record-essentials! plugin/record-essentials}
     */
    notAllKeys(keys: ReadonlyArray<Input<NonNullable<KeyShape>>>, options?: IssueOptions | Message): this;

    /**
     * Defines a relationship between keys where at least one of the keys is required (and more than one is allowed).
     *
     * @param keys The keys of which at least one must appear.
     * @param options The issue options or the issue message.
     * @returns The clone of the shape.
     * @group Plugin Methods
     * @plugin {@link plugin/record-essentials! plugin/record-essentials}
     */
    orKeys(keys: ReadonlyArray<Input<NonNullable<KeyShape>>>, options?: IssueOptions | Message): this;

    /**
     * Defines an exclusive relationship between a set of keys where one of them is required but not at the same time.
     *
     * @param keys The exclusive keys that must not appear together but where one of them is required.
     * @param options The issue options or the issue message.
     * @returns The clone of the shape.
     * @group Plugin Methods
     * @plugin {@link plugin/record-essentials! plugin/record-essentials}
     */
    xorKeys(keys: ReadonlyArray<Input<NonNullable<KeyShape>>>, options?: IssueOptions | Message): this;

    /**
     * Defines an exclusive relationship between a set of keys where only one is allowed but none are required.
     *
     * @param keys The exclusive keys that must not appear together but where none are required.
     * @param options The issue options or the issue message.
     * @returns The clone of the shape.
     * @group Plugin Methods
     * @plugin {@link plugin/record-essentials! plugin/record-essentials}
     */
    oxorKeys(keys: ReadonlyArray<Input<NonNullable<KeyShape>>>, options?: IssueOptions | Message): this;
  }
}

/**
 * Enhances {@link core!RecordShape RecordShape} with additional methods.
 */
export default function enableRecordEssentials(ctor: typeof RecordShape): void {
  enableObjectLikeEssentials(ctor);
}
