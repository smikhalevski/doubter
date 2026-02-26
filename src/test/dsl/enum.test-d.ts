import { expectTypeOf, test } from 'vitest';
import * as d from '../../main/index.js';
import { type INPUT, type OUTPUT } from '../../main/shape/Shape.js';

declare const INPUT: INPUT;
declare const OUTPUT: OUTPUT;

test('expected types', () => {
  expectTypeOf(d.enum([111, 'aaa'])[OUTPUT]).toEqualTypeOf<111 | 'aaa'>();

  enum FooEnum {
    AAA,
    BBB,
  }

  expectTypeOf(d.enum(FooEnum)[OUTPUT]).toEqualTypeOf<FooEnum.AAA | FooEnum.BBB>();

  expectTypeOf(d.enum({ AAA: 'aaa', BBB: 'bbb' } as const)[OUTPUT]).toEqualTypeOf<'aaa' | 'bbb'>();

  expectTypeOf(d.enum([111, 222, 333]).replace(222, 'aaa')[OUTPUT]).toEqualTypeOf<111 | 'aaa' | 333>();

  expectTypeOf(d.enum([33, 42]).replace(NaN, 0)[INPUT]).toEqualTypeOf<number>();

  expectTypeOf(d.enum([33, 42]).replace(NaN, 0)[OUTPUT]).toEqualTypeOf<33 | 42 | 0>();

  expectTypeOf(d.enum([111, 222, 333]).deny(222)[OUTPUT]).toEqualTypeOf<111 | 333>();

  expectTypeOf(d.enum([111, 222, 333]).refine((_value): _value is 222 => true)[OUTPUT]).toEqualTypeOf<222>();

  const enumValues = [111, 'aaa'] as const;

  expectTypeOf(d.enum(enumValues)[INPUT]).toEqualTypeOf<111 | 'aaa'>();

  expectTypeOf(d.enum(enumValues)[OUTPUT]).toEqualTypeOf<111 | 'aaa'>();
});
