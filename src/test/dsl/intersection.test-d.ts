import { expectTypeOf, test } from 'vitest';
import * as d from '../../main/index.js';

test('expected types', () => {
  expectTypeOf(d.and([d.object({ key1: d.string() }), d.object({ key2: d.number() })])['$inferOutput']).toEqualTypeOf<
    { key1: string } & { key2: number }
  >();

  expectTypeOf(d.and([d.string(), d.string()])['$inferOutput']).toEqualTypeOf<string>();

  expectTypeOf(d.and([d.or([d.string(), d.number()]), d.string()])['$inferOutput']).toEqualTypeOf<string>();

  expectTypeOf(
    d.and([d.or([d.string(), d.number(), d.boolean()]), d.or([d.string(), d.number()])])['$inferOutput']
  ).toEqualTypeOf<string | number>();

  expectTypeOf(d.and([d.or([d.string(), d.never()]), d.number()])['$inferOutput']).toEqualTypeOf<never>();

  expectTypeOf(d.and([d.any(), d.string()])['$inferOutput']).toEqualTypeOf<any>();

  expectTypeOf(d.and([d.never(), d.string()])['$inferOutput']).toEqualTypeOf<never>();

  expectTypeOf(d.and([d.never(), d.any()])['$inferOutput']).toEqualTypeOf<never>();

  expectTypeOf(d.and([d.never()])['$inferInput']).toEqualTypeOf<never>();

  expectTypeOf(d.and([d.never()])['$inferOutput']).toEqualTypeOf<never>();
});
