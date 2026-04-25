import { expectTypeOf, test } from 'vitest';
import * as d from '../../main/index.js';

test('expected types', () => {
  expectTypeOf(d.enum([111, 'aaa'])['$inferOutput']).toEqualTypeOf<111 | 'aaa'>();

  enum FooEnum {
    AAA,
    BBB,
  }

  expectTypeOf(d.enum(FooEnum)['$inferOutput']).toEqualTypeOf<FooEnum.AAA | FooEnum.BBB>();

  expectTypeOf(d.enum({ AAA: 'aaa', BBB: 'bbb' } as const)['$inferOutput']).toEqualTypeOf<'aaa' | 'bbb'>();

  expectTypeOf(d.enum([111, 222, 333]).replace(222, 'aaa')['$inferOutput']).toEqualTypeOf<111 | 'aaa' | 333>();

  expectTypeOf(d.enum([33, 42]).replace(NaN, 0)['$inferInput']).toEqualTypeOf<number>();

  expectTypeOf(d.enum([33, 42]).replace(NaN, 0)['$inferOutput']).toEqualTypeOf<33 | 42 | 0>();

  expectTypeOf(d.enum([111, 222, 333]).deny(222)['$inferOutput']).toEqualTypeOf<111 | 333>();

  expectTypeOf(d.enum([111, 222, 333]).refine((_value): _value is 222 => true)['$inferOutput']).toEqualTypeOf<222>();

  const enumValues = [111, 'aaa'] as const;

  expectTypeOf(d.enum(enumValues)['$inferInput']).toEqualTypeOf<111 | 'aaa'>();

  expectTypeOf(d.enum(enumValues)['$inferOutput']).toEqualTypeOf<111 | 'aaa'>();
});
