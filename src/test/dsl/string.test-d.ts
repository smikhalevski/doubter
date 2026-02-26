import { expectTypeOf, test } from 'vitest';
import * as d from '../../main/index.js';
import { type INPUT, type OUTPUT } from '../../main/shape/Shape.js';

declare const INPUT: INPUT;
declare const OUTPUT: OUTPUT;

test('expected types', () => {
  expectTypeOf(d.string().alter((): 'aaa' => 'aaa')[OUTPUT]).toEqualTypeOf<string>();

  const x = { param: 111 };

  d.string().alter((value, _param) => (value === 'aaa' ? 'aaa' : 'bbb'), x);

  const stringShape = d.string().alter(value => (value === 'aaa' ? 'aaa' : 'bbb'));

  expectTypeOf(stringShape[INPUT]).toEqualTypeOf<string>();

  expectTypeOf(stringShape[OUTPUT]).toEqualTypeOf<string>();

  expectTypeOf(stringShape.refine((_value): _value is 'bbb' => true)[OUTPUT]).toEqualTypeOf<'bbb'>();

  expectTypeOf(stringShape.refine((_value): _value is 'bbb' => true).max(2)[OUTPUT]).toEqualTypeOf<string>();

  expectTypeOf(
    d.string().alter(
      (value, param) => {
        expectTypeOf(param).toEqualTypeOf<number>();
        return value;
      },
      { param: 111 }
    )[OUTPUT]
  ).toEqualTypeOf<string>();

  expectTypeOf(d.string().refine((_value): _value is 'aaa' | 'bbb' => true)[OUTPUT]).toEqualTypeOf<'aaa' | 'bbb'>();
});
