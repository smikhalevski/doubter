import { expectTypeOf, test } from 'vitest';
import * as d from '../../main/index.js';
import { type INPUT, type OUTPUT } from '../../main/shape/Shape.js';

declare const INPUT: INPUT;
declare const OUTPUT: OUTPUT;

test('expected types', () => {
  expectTypeOf(d.lazy(() => d.string())[OUTPUT]).toEqualTypeOf<string>();

  expectTypeOf(d.lazy(() => d.string().convert(parseFloat))[OUTPUT]).toEqualTypeOf<string | number>();

  expectTypeOf(d.lazy(() => d.object({ aaa: d.string().convert(parseFloat) })).deepPartial()[INPUT]).toEqualTypeOf<{
    aaa?: string;
  }>();

  expectTypeOf(d.lazy(() => d.object({ aaa: d.string().convert(parseFloat) })).deepPartial()[OUTPUT]).toEqualTypeOf<
    { aaa?: string } | { aaa?: number }
  >();

  expectTypeOf(d.lazy(() => d.string()).circular(111)[OUTPUT]).toEqualTypeOf<string | 111>();

  expectTypeOf(d.lazy(() => d.object({ aaa: d.string().convert(parseFloat) })).circular(111)[OUTPUT]).toEqualTypeOf<
    { aaa: number } | 111
  >();

  expectTypeOf(
    d
      .lazy(() => d.object({ aaa: d.string().convert(parseFloat) }))
      .circular(111)
      .deepPartial()[OUTPUT]
  ).toEqualTypeOf<{ aaa?: string } | { aaa?: number }>();
});
