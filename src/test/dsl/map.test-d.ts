import { expectTypeOf, test } from 'vitest';
import * as d from '../../main/index.js';

test('expected types', () => {
  expectTypeOf(d.map(d.string(), d.number())['$inferOutput']).toEqualTypeOf<Map<string, number>>();

  expectTypeOf(
    d.map(
      d.string().convert((): 'bbb' => 'bbb'),
      d.number()
    )['$inferOutput']
  ).toEqualTypeOf<Map<'bbb', number>>();

  expectTypeOf(d.map(d.string(), d.number()).deepPartial()['$inferOutput']).toEqualTypeOf<
    Map<string, number | undefined>
  >();

  expectTypeOf(
    d.map(d.object({ aaa: d.string() }), d.object({ bbb: d.number() })).deepPartial()['$inferOutput']
  ).toEqualTypeOf<Map<{ aaa?: string }, { bbb?: number } | undefined>>();

  expectTypeOf(d.map(d.string(), d.string()).readonly()['$inferInput']).toEqualTypeOf<Map<string, string>>();

  expectTypeOf(d.map(d.string(), d.string()).readonly()['$inferOutput']).not.toExtend<Map<string, string>>();

  expectTypeOf(d.map(d.string(), d.string()).readonly()['$inferOutput']).toEqualTypeOf<ReadonlyMap<string, string>>();
});
