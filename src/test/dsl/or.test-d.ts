import { expectTypeOf, test } from 'vitest';
import * as d from '../../main/index.js';
import { type OUTPUT } from '../../main/shape/Shape.js';

declare const OUTPUT: OUTPUT;

test('expected types', () => {
  expectTypeOf(d.or([d.number(), d.string()])[OUTPUT]).toEqualTypeOf<number | string>();

  expectTypeOf(d.or([d.object({ key1: d.string() }), d.object({ key2: d.number() })])[OUTPUT]).toEqualTypeOf<
    { key1: string } | { key2: number }
  >();

  expectTypeOf(
    d
      .or([
        d.object({
          aaa: d.string(),
        }),
        d.object({
          bbb: d.number(),
        }),
      ])
      .deepPartial()[OUTPUT]
  ).toEqualTypeOf<{ aaa?: string } | { bbb?: number }>();

  expectTypeOf(
    d
      .or([
        d.object({
          aaa: d.array(d.string()),
        }),
        d.object({
          bbb: d.number(),
        }),
      ])
      .deepPartial()[OUTPUT]
  ).toEqualTypeOf<{ aaa?: Array<string | undefined> } | { bbb?: number }>();
});
