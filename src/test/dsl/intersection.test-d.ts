import { expectTypeOf, test } from 'vitest';
import * as d from '../../main/index.js';
import { type INPUT, type OUTPUT } from '../../main/shape/Shape.js';

declare const INPUT: INPUT;
declare const OUTPUT: OUTPUT;

test('expected types', () => {
  expectTypeOf(d.and([d.object({ key1: d.string() }), d.object({ key2: d.number() })])[OUTPUT]).toEqualTypeOf<
    { key1: string } & { key2: number }
  >();

  expectTypeOf(d.and([d.string(), d.string()])[OUTPUT]).toEqualTypeOf<string>();

  expectTypeOf(d.and([d.or([d.string(), d.number()]), d.string()])[OUTPUT]).toEqualTypeOf<string>();

  expectTypeOf(
    d.and([d.or([d.string(), d.number(), d.boolean()]), d.or([d.string(), d.number()])])[OUTPUT]
  ).toEqualTypeOf<string | number>();

  expectTypeOf(d.and([d.or([d.string(), d.never()]), d.number()])[OUTPUT]).toEqualTypeOf<never>();

  expectTypeOf(d.and([d.any(), d.string()])[OUTPUT]).toEqualTypeOf<any>();

  expectTypeOf(d.and([d.never(), d.string()])[OUTPUT]).toEqualTypeOf<never>();

  expectTypeOf(d.and([d.never(), d.any()])[OUTPUT]).toEqualTypeOf<never>();

  expectTypeOf(d.and([d.never()])[INPUT]).toEqualTypeOf<never>();

  expectTypeOf(d.and([d.never()])[OUTPUT]).toEqualTypeOf<never>();
});
