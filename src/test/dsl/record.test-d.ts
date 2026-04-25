import { expectTypeOf, test } from 'vitest';
import * as d from '../../main/index.js';

test('expected types', () => {
  expectTypeOf(d.record(d.number())['$inferOutput']).toEqualTypeOf<Record<string, number>>();

  expectTypeOf(
    d.record(
      d.string().convert((): 'bbb' => 'bbb'),
      d.number()
    )['$inferOutput']
  ).toEqualTypeOf<{ bbb: number }>();

  expectTypeOf(d.record(d.string(), d.boolean().optional())['$inferOutput']).toEqualTypeOf<
    Record<string, boolean | undefined>
  >();

  d.record(d.number()).notAllKeys(['bbb']);

  d.record(d.enum(['aaa', 'bbb']), d.number()).notAllKeys(['bbb']);

  d.record(
    d.string().convert(x => x as 'aaa' | 'bbb'),
    d.number()
  ).notAllKeys(['bbb']);

  d.record(d.number()).notAllKeys(['bbb']);

  expectTypeOf(d.record(d.number()).readonly()['$inferInput']).toEqualTypeOf<{ [key: string]: number }>();

  expectTypeOf(d.record(d.number()).readonly()['$inferOutput']).toEqualTypeOf<{ readonly [key: string]: number }>();
});
