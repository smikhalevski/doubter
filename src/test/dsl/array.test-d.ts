import { expectTypeOf, test } from 'vitest';
import * as d from '../../main/index.js';
import { type INPUT, type OUTPUT } from '../../main/shape/Shape.js';

declare const INPUT: INPUT;
declare const OUTPUT: OUTPUT;

test('expected types', () => {
  expectTypeOf(d.array()[INPUT]).toEqualTypeOf<any[]>();

  expectTypeOf(d.array()[OUTPUT]).toEqualTypeOf<any[]>();

  expectTypeOf(d.array(d.const(111))[INPUT]).toEqualTypeOf<111[]>();

  expectTypeOf(d.array(d.const(111))[OUTPUT]).toEqualTypeOf<111[]>();

  expectTypeOf(d.array(d.number()).deepPartial()[OUTPUT]).toEqualTypeOf<Array<number | undefined>>();

  expectTypeOf(d.array(d.object({ aaa: d.number() })).deepPartial()[OUTPUT]).toEqualTypeOf<
    Array<{ aaa?: number } | undefined>
  >();

  expectTypeOf(d.array(d.string()).readonly()[INPUT]).toEqualTypeOf<string[]>();

  expectTypeOf(d.array(d.string()).readonly()[OUTPUT]).not.toExtend<string[]>();

  expectTypeOf(d.array(d.string()).readonly()[OUTPUT]).toEqualTypeOf<readonly string[]>();
});
