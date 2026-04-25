import { expectTypeOf, test } from 'vitest';
import * as d from '../../main/index.js';

test('expected types', () => {
  expectTypeOf(d.string().alter((): 'aaa' => 'aaa')['$inferOutput']).toEqualTypeOf<string>();

  const x = { param: 111 };

  d.string().alter((value, _param) => (value === 'aaa' ? 'aaa' : 'bbb'), x);

  const stringShape = d.string().alter(value => (value === 'aaa' ? 'aaa' : 'bbb'));

  expectTypeOf(stringShape['$inferInput']).toEqualTypeOf<string>();

  expectTypeOf(stringShape['$inferOutput']).toEqualTypeOf<string>();

  expectTypeOf(stringShape.refine((_value): _value is 'bbb' => true)['$inferOutput']).toEqualTypeOf<'bbb'>();

  expectTypeOf(stringShape.refine((_value): _value is 'bbb' => true).max(2)['$inferOutput']).toEqualTypeOf<string>();

  expectTypeOf(
    d.string().alter(
      (value, param) => {
        expectTypeOf(param).toEqualTypeOf<number>();
        return value;
      },
      { param: 111 }
    )['$inferOutput']
  ).toEqualTypeOf<string>();

  expectTypeOf(d.string().refine((_value): _value is 'aaa' | 'bbb' => true)['$inferOutput']).toEqualTypeOf<
    'aaa' | 'bbb'
  >();
});
