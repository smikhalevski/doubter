import { expectTypeOf, test } from 'vitest';
import * as d from '../../main/index.js';

test('expected type', () => {
  expectTypeOf(d.and([d.object({ key1: d.string() }), d.object({ key2: d.number() })])['$inferOutput']).toEqualTypeOf<
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
      .deepPartial()['$inferOutput']
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
      .deepPartial()['$inferOutput']
  ).toEqualTypeOf<{ aaa?: Array<string | undefined> } & { bbb?: number }>();
});
