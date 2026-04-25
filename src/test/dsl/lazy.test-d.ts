import { expectTypeOf, test } from 'vitest';
import * as d from '../../main/index.js';

test('expected types', () => {
  expectTypeOf(d.lazy(() => d.string())['$inferOutput']).toEqualTypeOf<string>();

  expectTypeOf(d.lazy(() => d.string().convert(parseFloat))['$inferOutput']).toEqualTypeOf<string | number>();

  expectTypeOf(
    d.lazy(() => d.object({ aaa: d.string().convert(parseFloat) })).deepPartial()['$inferInput']
  ).toEqualTypeOf<{
    aaa?: string;
  }>();

  expectTypeOf(
    d.lazy(() => d.object({ aaa: d.string().convert(parseFloat) })).deepPartial()['$inferOutput']
  ).toEqualTypeOf<{ aaa?: string } | { aaa?: number }>();

  expectTypeOf(d.lazy(() => d.string()).circular(111)['$inferOutput']).toEqualTypeOf<string | 111>();

  expectTypeOf(
    d.lazy(() => d.object({ aaa: d.string().convert(parseFloat) })).circular(111)['$inferOutput']
  ).toEqualTypeOf<{ aaa: number } | 111>();

  expectTypeOf(
    d
      .lazy(() => d.object({ aaa: d.string().convert(parseFloat) }))
      .circular(111)
      .deepPartial()['$inferOutput']
  ).toEqualTypeOf<{ aaa?: string } | { aaa?: number }>();
});
