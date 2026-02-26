import { expectTypeOf, test } from 'vitest';
import * as d from '../../main/index.js';
import { type INPUT, type OUTPUT } from '../../main/shape/Shape.js';

declare const INPUT: INPUT;
declare const OUTPUT: OUTPUT;

test('expected types', () => {
  expectTypeOf(d.record(d.number())[OUTPUT]).toEqualTypeOf<Record<string, number>>();

  expectTypeOf(
    d.record(
      d.string().convert((): 'bbb' => 'bbb'),
      d.number()
    )[OUTPUT]
  ).toEqualTypeOf<{ bbb: number }>();

  expectTypeOf(d.record(d.string(), d.boolean().optional())[OUTPUT]).toEqualTypeOf<
    Record<string, boolean | undefined>
  >();

  d.record(d.number()).notAllKeys(['bbb']);

  d.record(d.enum(['aaa', 'bbb']), d.number()).notAllKeys(['bbb']);

  d.record(
    d.string().convert(x => x as 'aaa' | 'bbb'),
    d.number()
  ).notAllKeys(['bbb']);

  d.record(d.number()).notAllKeys(['bbb']);

  expectTypeOf(d.record(d.number()).readonly()[INPUT]).toEqualTypeOf<{ [key: string]: number }>();

  expectTypeOf(d.record(d.number()).readonly()[OUTPUT]).toEqualTypeOf<{ readonly [key: string]: number }>();
});
