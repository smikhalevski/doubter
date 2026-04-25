import { expectTypeOf, test } from 'vitest';
import * as d from '../../main/index.js';

test('expected types', () => {
  expectTypeOf(d.array()['$inferInput']).toEqualTypeOf<any[]>();

  expectTypeOf(d.array()['$inferOutput']).toEqualTypeOf<any[]>();

  expectTypeOf(d.array(d.const(111))['$inferInput']).toEqualTypeOf<111[]>();

  expectTypeOf(d.array(d.const(111))['$inferOutput']).toEqualTypeOf<111[]>();

  expectTypeOf(d.array(d.number()).deepPartial()['$inferOutput']).toEqualTypeOf<Array<number | undefined>>();

  expectTypeOf(d.array(d.object({ aaa: d.number() })).deepPartial()['$inferOutput']).toEqualTypeOf<
    Array<{ aaa?: number } | undefined>
  >();

  expectTypeOf(d.array(d.string()).readonly()['$inferInput']).toEqualTypeOf<string[]>();

  expectTypeOf(d.array(d.string()).readonly()['$inferOutput']).not.toExtend<string[]>();

  expectTypeOf(d.array(d.string()).readonly()['$inferOutput']).toEqualTypeOf<readonly string[]>();
});
