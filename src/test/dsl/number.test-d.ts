import { expectTypeOf, test } from 'vitest';
import * as d from '../../main/index.js';
import { type INPUT, type OUTPUT } from '../../main/shape/Shape.js';

declare const INPUT: INPUT;
declare const OUTPUT: OUTPUT;

test('expected types', () => {
  expectTypeOf(d.number().replace('aaa', true)[INPUT]).toEqualTypeOf<number | 'aaa'>();

  expectTypeOf(d.number().replace('aaa', true)[OUTPUT]).toEqualTypeOf<number | true>();

  expectTypeOf(d.number().replace(222, 'aaa')[INPUT]).toEqualTypeOf<number>();

  expectTypeOf(d.number().replace(222, 'aaa')[OUTPUT]).toEqualTypeOf<number | 'aaa'>();

  expectTypeOf(d.number().replace(NaN, 0)[INPUT]).toEqualTypeOf<number>();

  expectTypeOf(d.number().replace(NaN, 0)[OUTPUT]).toEqualTypeOf<number>();

  expectTypeOf(d.number().nan()[INPUT]).toEqualTypeOf<number>();

  expectTypeOf(d.number().nan()[OUTPUT]).toEqualTypeOf<number>();

  expectTypeOf(d.number().nan(111)[INPUT]).toEqualTypeOf<number>();

  expectTypeOf(d.number().nan(111)[OUTPUT]).toEqualTypeOf<number>();

  expectTypeOf(d.number().nan('aaa')[INPUT]).toEqualTypeOf<number>();

  expectTypeOf(d.number().nan('aaa')[OUTPUT]).toEqualTypeOf<number | 'aaa'>();

  expectTypeOf(d.number().allow(Infinity)[OUTPUT]).toEqualTypeOf<number>();

  expectTypeOf(d.number().deny(111)[INPUT]).toEqualTypeOf<number>();

  expectTypeOf(d.number().deny(111)[OUTPUT]).toEqualTypeOf<number>();

  expectTypeOf(d.number().alter(Math.abs).alter(Math.pow, { param: 3 })[OUTPUT]).toEqualTypeOf<number>();
});
