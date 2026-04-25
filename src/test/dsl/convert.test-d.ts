import { expectTypeOf, test } from 'vitest';
import * as d from '../../main/index.js';

test('expected types', () => {
  expectTypeOf(d.convert(() => 'aaa')['$inferInput']).toEqualTypeOf<any>();

  expectTypeOf(d.convert(() => 'aaa')['$inferOutput']).toEqualTypeOf<string>();

  const shape = d
    .object({
      years: d.array(d.string()).convert(years => years.map(parseFloat)),
    })
    .deepPartial();

  expectTypeOf(shape['$inferInput']).toEqualTypeOf<{ years?: string[] }>();

  expectTypeOf(shape['$inferOutput']).toEqualTypeOf<{ years?: number[] }>();
});
