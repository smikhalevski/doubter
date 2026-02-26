import { expectTypeOf, test } from 'vitest';
import * as d from '../../main/index.js';
import { type INPUT, type OUTPUT } from '../../main/shape/Shape.js';

declare const INPUT: INPUT;
declare const OUTPUT: OUTPUT;

test('expected types', () => {
  expectTypeOf(d.any((_value): _value is 111 => true)[INPUT]).toEqualTypeOf<111>();

  expectTypeOf(d.any((_value): _value is 111 => true)[OUTPUT]).toEqualTypeOf<111>();

  expectTypeOf(d.any<string>()[INPUT]).toEqualTypeOf<string>();

  expectTypeOf(d.any<string>()[OUTPUT]).toEqualTypeOf<string>();

  expectTypeOf(d.any<string>(() => true)[INPUT]).toEqualTypeOf<string>();

  expectTypeOf(d.any<string>(() => true)[OUTPUT]).toEqualTypeOf<string>();
});

test('refine', () => {
  expectTypeOf(d.any().refine((_value: unknown): _value is number => true)[INPUT]).toEqualTypeOf<any>();

  expectTypeOf(d.any().refine((_value: unknown): _value is number => true)[OUTPUT]).toEqualTypeOf<number>();
});

test('ReplaceShape', () => {
  expectTypeOf(d.any<string>().nullable()[OUTPUT]).toEqualTypeOf<string | null>();

  expectTypeOf(d.any<string>().nullable(111)[OUTPUT]).toEqualTypeOf<string | 111>();

  expectTypeOf(d.any<111 | 222>().replace(222, 333)[OUTPUT]).toEqualTypeOf<111 | 333>();

  expectTypeOf(d.any<111 | 222>().replace(222 as number, 333)[OUTPUT]).toEqualTypeOf<111 | 222 | 333>();

  expectTypeOf(d.any<111 | 222>().replace(NaN, 333)[INPUT]).toEqualTypeOf<number>();

  expectTypeOf(d.any<111 | 222>().replace(NaN, 333)[OUTPUT]).toEqualTypeOf<111 | 222 | 333>();
});

test('parse', () => {
  expectTypeOf(d.any<string>().parseOrDefault(111)).toEqualTypeOf<string | undefined>();

  expectTypeOf<string | true>(d.any<string>().parseOrDefault(111, true)).toEqualTypeOf<string | true>();
});

test('CatchShape', () => {
  expectTypeOf(d.number().catch()[OUTPUT]).toEqualTypeOf<number | undefined>();

  expectTypeOf(d.number().catch('aaa')[OUTPUT]).toEqualTypeOf<number | 'aaa'>();

  expectTypeOf(d.number().catch(() => 'aaa')[OUTPUT]).toEqualTypeOf<number | 'aaa'>();
});

test('deepPartial', () => {
  // ConvertShape is opaque for deepPartial
  expectTypeOf(
    d.object({ aaa: d.object({ bbb: d.number() }).convert(value => value) }).deepPartial()[OUTPUT]
  ).toEqualTypeOf<{ aaa?: { bbb: number } }>();

  expectTypeOf(
    d
      .object({ aaa: d.string().convert(parseFloat) })
      .to(d.object({ aaa: d.number() }))
      .deepPartial()[INPUT]
  ).toEqualTypeOf<{ aaa?: string }>();

  expectTypeOf(
    d
      .object({ aaa: d.string().convert(parseFloat) })
      .to(d.object({ aaa: d.number() }))
      .deepPartial()[OUTPUT]
  ).toEqualTypeOf<{ aaa?: number }>();

  expectTypeOf(
    d
      .or([d.object({ aaa: d.string() }), d.const(111)])
      .deny(111)
      .deepPartial()[OUTPUT]
  ).toEqualTypeOf<{ aaa?: string }>();

  expectTypeOf(d.object({ aaa: d.string() }).catch().deepPartial()[OUTPUT]).toEqualTypeOf<
    { aaa?: string } | undefined
  >();

  expectTypeOf(d.object({ aaa: d.string() }).catch(111).deepPartial()[OUTPUT]).toEqualTypeOf<{ aaa?: string } | 111>();
});

test('BrandShape', () => {
  const brandShape = d.any<string>().refine<string & { BRAND: 'zzz' }>();

  expectTypeOf(brandShape[OUTPUT]).toEqualTypeOf<d.Output<typeof brandShape>>();

  expectTypeOf(brandShape.parse('aaa')).toEqualTypeOf<d.Output<typeof brandShape>>();

  expectTypeOf('aaa').not.toEqualTypeOf<d.Output<typeof brandShape>>();

  expectTypeOf(d.any<string>().refine<string & { BRAND: 'bbb' }>()[OUTPUT]).not.toEqualTypeOf<
    d.Output<typeof brandShape>
  >();

  // deepPartial is visible on branded shapes
  expectTypeOf(d.object({ aaa: d.string() }).refine().deepPartial()[OUTPUT]).toEqualTypeOf<{ aaa?: string }>();

  // Branded shapes are transparent for deepPartial
  expectTypeOf(d.object({ aaa: d.object({ bbb: d.string() }).refine() }).deepPartial()[OUTPUT]).toEqualTypeOf<{
    aaa?: { bbb?: string };
  }>();
});

test('not', () => {
  expectTypeOf(d.enum([111, 222]).not(d.number())[INPUT]).toEqualTypeOf<111 | 222>();

  expectTypeOf(d.enum([111, 222]).not(d.number())[OUTPUT]).toEqualTypeOf<111 | 222>();

  expectTypeOf(d.enum([111, 222]).not(d.const(222))[INPUT]).toEqualTypeOf<111 | 222>();

  expectTypeOf(d.enum([111, 222]).not(d.const(222))[OUTPUT]).toEqualTypeOf<111 | 222>();
});

test('exclude', () => {
  expectTypeOf(d.enum([111, 222]).exclude(d.number())[INPUT]).toEqualTypeOf<111 | 222>();

  expectTypeOf(d.enum([111, 222]).exclude(d.number())[OUTPUT]).toEqualTypeOf<never>();

  expectTypeOf(d.enum([111, 222]).exclude(d.const(222))[INPUT]).toEqualTypeOf<111 | 222>();

  expectTypeOf(d.enum([111, 222]).exclude(d.const(222))[OUTPUT]).toEqualTypeOf<111>();
});

test('parseOrDefault', () => {
  expectTypeOf<111 | 222 | 333>(d.enum([111, 222]).parseOrDefault('aaa', 333)).toEqualTypeOf<111 | 222 | 333>();

  expectTypeOf<string | 111>(d.string().parseOrDefault('aaa', 111)).toEqualTypeOf<string | 111>();
});

test('parseOrDefaultAsync', () => {
  expectTypeOf<Promise<111 | 222 | 333>>(d.enum([111, 222]).parseOrDefaultAsync('aaa', 333)).toEqualTypeOf<
    Promise<111 | 222 | 333>
  >();

  expectTypeOf<Promise<string | 111>>(d.string().parseOrDefaultAsync('aaa', 111)).toEqualTypeOf<
    Promise<string | 111>
  >();
});
