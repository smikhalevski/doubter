import { expectTypeOf, test } from 'vitest';
import * as d from '../../main/index.js';
import { type INPUT, type OUTPUT } from '../../main/shape/Shape.js';

declare const INPUT: INPUT;
declare const OUTPUT: OUTPUT;

test('expected types', () => {
  expectTypeOf(d.map(d.string(), d.number())[OUTPUT]).toEqualTypeOf<Map<string, number>>();

  expectTypeOf(
    d.map(
      d.string().convert((): 'bbb' => 'bbb'),
      d.number()
    )[OUTPUT]
  ).toEqualTypeOf<Map<'bbb', number>>();

  expectTypeOf(d.map(d.string(), d.number()).deepPartial()[OUTPUT]).toEqualTypeOf<Map<string, number | undefined>>();

  expectTypeOf(d.map(d.object({ aaa: d.string() }), d.object({ bbb: d.number() })).deepPartial()[OUTPUT]).toEqualTypeOf<
    Map<{ aaa?: string }, { bbb?: number } | undefined>
  >();

  expectTypeOf(d.map(d.string(), d.string()).readonly()[INPUT]).toEqualTypeOf<Map<string, string>>();

  expectTypeOf(d.map(d.string(), d.string()).readonly()[OUTPUT]).not.toExtend<Map<string, string>>();

  expectTypeOf(d.map(d.string(), d.string()).readonly()[OUTPUT]).toEqualTypeOf<ReadonlyMap<string, string>>();
});
