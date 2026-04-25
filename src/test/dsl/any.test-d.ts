import { expectTypeOf, test } from 'vitest';
import * as d from '../../main/index.js';

test('expected types', () => {
  expectTypeOf(d.any((_value): _value is 111 => true)['$inferInput']).toEqualTypeOf<111>();

  expectTypeOf(d.any((_value): _value is 111 => true)['$inferOutput']).toEqualTypeOf<111>();

  expectTypeOf(d.any<string>()['$inferInput']).toEqualTypeOf<string>();

  expectTypeOf(d.any<string>()['$inferOutput']).toEqualTypeOf<string>();

  expectTypeOf(d.any<string>(() => true)['$inferInput']).toEqualTypeOf<string>();

  expectTypeOf(d.any<string>(() => true)['$inferOutput']).toEqualTypeOf<string>();
});

test('refine', () => {
  expectTypeOf(d.any().refine((_value: unknown): _value is number => true)['$inferInput']).toEqualTypeOf<any>();

  expectTypeOf(d.any().refine((_value: unknown): _value is number => true)['$inferOutput']).toEqualTypeOf<number>();
});

test('ReplaceShape', () => {
  expectTypeOf(d.any<string>().nullable()['$inferOutput']).toEqualTypeOf<string | null>();

  expectTypeOf(d.any<string>().nullable(111)['$inferOutput']).toEqualTypeOf<string | 111>();

  expectTypeOf(d.any<111 | 222>().replace(222, 333)['$inferOutput']).toEqualTypeOf<111 | 333>();

  expectTypeOf(d.any<111 | 222>().replace(222 as number, 333)['$inferOutput']).toEqualTypeOf<111 | 222 | 333>();

  expectTypeOf(d.any<111 | 222>().replace(NaN, 333)['$inferInput']).toEqualTypeOf<number>();

  expectTypeOf(d.any<111 | 222>().replace(NaN, 333)['$inferOutput']).toEqualTypeOf<111 | 222 | 333>();
});

test('parse', () => {
  expectTypeOf(d.any<string>().parseOrDefault(111)).toEqualTypeOf<string | undefined>();

  expectTypeOf<string | true>(d.any<string>().parseOrDefault(111, true)).toEqualTypeOf<string | true>();
});

test('CatchShape', () => {
  expectTypeOf(d.number().catch()['$inferOutput']).toEqualTypeOf<number | undefined>();

  expectTypeOf(d.number().catch('aaa')['$inferOutput']).toEqualTypeOf<number | 'aaa'>();

  expectTypeOf(d.number().catch(() => 'aaa')['$inferOutput']).toEqualTypeOf<number | 'aaa'>();
});

test('deepPartial', () => {
  // ConvertShape is opaque for deepPartial
  expectTypeOf(
    d.object({ aaa: d.object({ bbb: d.number() }).convert(value => value) }).deepPartial()['$inferOutput']
  ).toEqualTypeOf<{ aaa?: { bbb: number } }>();

  expectTypeOf(
    d
      .object({ aaa: d.string().convert(parseFloat) })
      .to(d.object({ aaa: d.number() }))
      .deepPartial()['$inferInput']
  ).toEqualTypeOf<{ aaa?: string }>();

  expectTypeOf(
    d
      .object({ aaa: d.string().convert(parseFloat) })
      .to(d.object({ aaa: d.number() }))
      .deepPartial()['$inferOutput']
  ).toEqualTypeOf<{ aaa?: number }>();

  expectTypeOf(
    d
      .or([d.object({ aaa: d.string() }), d.const(111)])
      .deny(111)
      .deepPartial()['$inferOutput']
  ).toEqualTypeOf<{ aaa?: string }>();

  expectTypeOf(d.object({ aaa: d.string() }).catch().deepPartial()['$inferOutput']).toEqualTypeOf<
    { aaa?: string } | undefined
  >();

  expectTypeOf(d.object({ aaa: d.string() }).catch(111).deepPartial()['$inferOutput']).toEqualTypeOf<
    { aaa?: string } | 111
  >();
});

test('BrandShape', () => {
  const brandShape = d.any<string>().brand<{ BRAND: 'zzz' }>();

  expectTypeOf(brandShape['$inferOutput']).toEqualTypeOf<d.InferOutput<typeof brandShape>>();

  expectTypeOf(brandShape.parse('aaa')).toEqualTypeOf<d.InferOutput<typeof brandShape>>();

  expectTypeOf('aaa').not.toEqualTypeOf<d.InferOutput<typeof brandShape>>();

  expectTypeOf(d.any<string>().brand<{ BRAND: 'bbb' }>()['$inferOutput']).not.toEqualTypeOf<
    d.InferOutput<typeof brandShape>
  >();

  // deepPartial is visible on branded shapes
  expectTypeOf(d.object({ aaa: d.string() }).brand().deepPartial()['$inferOutput']).toEqualTypeOf<{ aaa?: string }>();

  // Branded shapes are transparent for deepPartial
  expectTypeOf(d.object({ aaa: d.object({ bbb: d.string() }).brand() }).deepPartial()['$inferOutput']).toEqualTypeOf<{
    aaa?: { bbb?: string };
  }>();
});

test('not', () => {
  expectTypeOf(d.enum([111, 222]).not(d.number())['$inferInput']).toEqualTypeOf<111 | 222>();

  expectTypeOf(d.enum([111, 222]).not(d.number())['$inferOutput']).toEqualTypeOf<111 | 222>();

  expectTypeOf(d.enum([111, 222]).not(d.const(222))['$inferInput']).toEqualTypeOf<111 | 222>();

  expectTypeOf(d.enum([111, 222]).not(d.const(222))['$inferOutput']).toEqualTypeOf<111 | 222>();
});

test('exclude', () => {
  expectTypeOf(d.enum([111, 222]).exclude(d.number())['$inferInput']).toEqualTypeOf<111 | 222>();

  expectTypeOf(d.enum([111, 222]).exclude(d.number())['$inferOutput']).toEqualTypeOf<never>();

  expectTypeOf(d.enum([111, 222]).exclude(d.const(222))['$inferInput']).toEqualTypeOf<111 | 222>();

  expectTypeOf(d.enum([111, 222]).exclude(d.const(222))['$inferOutput']).toEqualTypeOf<111>();
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
