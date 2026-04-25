import { expectTypeOf, test } from 'vitest';
import * as d from '../../main/index.js';

test('expected types', () => {
  expectTypeOf(d.or([d.number(), d.string()])['$inferOutput']).toEqualTypeOf<number | string>();

  expectTypeOf(d.or([d.object({ key1: d.string() }), d.object({ key2: d.number() })])['$inferOutput']).toEqualTypeOf<
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
      .deepPartial()['$inferOutput']
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
      .deepPartial()['$inferOutput']
  ).toEqualTypeOf<{ aaa?: Array<string | undefined> } | { bbb?: number }>();
});
