import { expectTypeOf, test } from 'vitest';
import * as d from '../../main/index.js';
import { type INPUT, type OUTPUT } from '../../main/shape/Shape.js';

declare const INPUT: INPUT;
declare const OUTPUT: OUTPUT;

test('expected types', () => {
  expectTypeOf(d.convert(() => 'aaa')[INPUT]).toEqualTypeOf<any>();

  expectTypeOf(d.convert(() => 'aaa')[OUTPUT]).toEqualTypeOf<string>();

  const shape = d
    .object({
      years: d.array(d.string()).convert(years => years.map(parseFloat)),
    })
    .deepPartial();

  expectTypeOf(shape[INPUT]).toEqualTypeOf<{ years?: string[] }>();

  expectTypeOf(shape[OUTPUT]).toEqualTypeOf<{ years?: number[] }>();
});
