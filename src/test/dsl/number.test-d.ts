import { expectTypeOf, test } from 'vitest';
import * as d from '../../main/index.js';

test('expected types', () => {
  expectTypeOf(d.number().replace('aaa', true)['$inferInput']).toEqualTypeOf<number | 'aaa'>();

  expectTypeOf(d.number().replace('aaa', true)['$inferOutput']).toEqualTypeOf<number | true>();

  expectTypeOf(d.number().replace(222, 'aaa')['$inferInput']).toEqualTypeOf<number>();

  expectTypeOf(d.number().replace(222, 'aaa')['$inferOutput']).toEqualTypeOf<number | 'aaa'>();

  expectTypeOf(d.number().replace(NaN, 0)['$inferInput']).toEqualTypeOf<number>();

  expectTypeOf(d.number().replace(NaN, 0)['$inferOutput']).toEqualTypeOf<number>();

  expectTypeOf(d.number().nan()['$inferInput']).toEqualTypeOf<number>();

  expectTypeOf(d.number().nan()['$inferOutput']).toEqualTypeOf<number>();

  expectTypeOf(d.number().nan(111)['$inferInput']).toEqualTypeOf<number>();

  expectTypeOf(d.number().nan(111)['$inferOutput']).toEqualTypeOf<number>();

  expectTypeOf(d.number().nan('aaa')['$inferInput']).toEqualTypeOf<number>();

  expectTypeOf(d.number().nan('aaa')['$inferOutput']).toEqualTypeOf<number | 'aaa'>();

  expectTypeOf(d.number().allow(Infinity)['$inferOutput']).toEqualTypeOf<number>();

  expectTypeOf(d.number().deny(111)['$inferInput']).toEqualTypeOf<number>();

  expectTypeOf(d.number().deny(111)['$inferOutput']).toEqualTypeOf<number>();

  expectTypeOf(d.number().alter(Math.abs).alter(Math.pow, { param: 3 })['$inferOutput']).toEqualTypeOf<number>();
});
