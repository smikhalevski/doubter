import { expectTypeOf, test } from 'vitest';
import * as d from '../../main/index.js';
import { type OUTPUT } from '../../main/shape/Shape.js';

declare const OUTPUT: OUTPUT;

test('expected type', () => {
  expectTypeOf(d.and([d.object({ key1: d.string() }), d.object({ key2: d.number() })])[OUTPUT]).toEqualTypeOf<
    { key1: string } & { key2: number }
  >();

  expectTypeOf(
    d
      .and([
        d.object({
          aaa: d.string(),
        }),
        d.object({
          bbb: d.number(),
        }),
      ])
      .deepPartial()[OUTPUT]
  ).toEqualTypeOf<{ aaa?: string } & { bbb?: number }>();

  expectTypeOf(
    d
      .and([
        d.object({
          aaa: d.array(d.string()),
        }),
        d.object({
          bbb: d.number(),
        }),
      ])
      .deepPartial()[OUTPUT]
  ).toEqualTypeOf<{ aaa?: Array<string | undefined> } & { bbb?: number }>();
});
