import * as d from 'doubter';
import { expectNotType, expectType } from 'tsd';

expectType<111>(d.any((value): value is 111 => true)[d.INPUT]);

expectType<111>(d.any((value): value is 111 => true)[d.OUTPUT]);

expectType<string>(d.any<string>()[d.INPUT]);

expectType<string>(d.any<string>()[d.OUTPUT]);

expectType<string>(d.any<string>(() => true)[d.INPUT]);

expectType<string>(d.any<string>(() => true)[d.OUTPUT]);

// refine()

expectType<any>(d.any().refine((value: unknown): value is number => true)[d.INPUT]);

expectType<number>(d.any().refine((value: unknown): value is number => true)[d.OUTPUT]);

// ReplaceLiteralShape

expectType<string | null>(d.any<string>().nullable()[d.OUTPUT]);

expectType<string | 111>(d.any<string>().nullable(111)[d.OUTPUT]);

expectType<111 | 333>(d.any<111 | 222>().replace(222, 333)[d.OUTPUT]);

expectType<111 | 222 | 333>(d.any<111 | 222>().replace(222 as number, 333)[d.OUTPUT]);

expectType<number>(d.any<111 | 222>().replace(NaN, 333)[d.INPUT]);

expectType<111 | 222 | 333>(d.any<111 | 222>().replace(NaN, 333)[d.OUTPUT]);

// parse()

expectType<string | undefined>(d.any<string>().parseOrDefault(111));

expectType<string | true>(d.any<string>().parseOrDefault(111, true));

// CatchShape

expectType<number | undefined>(d.number().catch()[d.OUTPUT]);

expectType<number | 'aaa'>(d.number().catch('aaa')[d.OUTPUT]);

expectType<number | 'aaa'>(d.number().catch(() => 'aaa')[d.OUTPUT]);

// deepPartial()

// ConvertShape is opaque for deepPartial
expectType<{ aaa?: { bbb: number } }>(
  d.object({ aaa: d.object({ bbb: d.number() }).convert(value => value) }).deepPartial()[d.OUTPUT]
);

expectType<{ aaa?: string }>(
  d
    .object({ aaa: d.string().convert(parseFloat) })
    .to(d.object({ aaa: d.number() }))
    .deepPartial()[d.INPUT]
);

expectType<{ aaa?: number }>(
  d
    .object({ aaa: d.string().convert(parseFloat) })
    .to(d.object({ aaa: d.number() }))
    .deepPartial()[d.OUTPUT]
);

expectType<{ aaa?: string }>(
  d
    .or([d.object({ aaa: d.string() }), d.const(111)])
    .deny(111)
    .deepPartial()[d.OUTPUT]
);

expectType<{ aaa?: string } | undefined>(d.object({ aaa: d.string() }).catch().deepPartial()[d.OUTPUT]);

expectType<{ aaa?: string } | 111>(d.object({ aaa: d.string() }).catch(111).deepPartial()[d.OUTPUT]);

// BrandShape

expectType<d.Branded<string, 'foo'>>(d.string().brand<'foo'>()[d.OUTPUT]);

const brandShape = d.any<string>().brand();

expectType<d.Output<typeof brandShape>>(brandShape[d.OUTPUT]);

expectType<d.Output<typeof brandShape>>(brandShape.parse('aaa'));

expectNotType<d.Output<typeof brandShape>>('aaa');

expectNotType<d.Output<typeof brandShape>>(d.any<string>().brand<'bbb'>()[d.OUTPUT]);

// deepPartial is visible on branded shapes
expectType<{ aaa?: string }>(d.object({ aaa: d.string() }).brand().deepPartial()[d.OUTPUT]);

// Branded shapes are transparent for deepPartial
expectType<{ aaa?: { bbb?: string } }>(
  d.object({ aaa: d.object({ bbb: d.string() }).brand() }).deepPartial()[d.OUTPUT]
);

// not()

expectType<111 | 222>(d.enum([111, 222]).not(d.number())[d.INPUT]);

expectType<111 | 222>(d.enum([111, 222]).not(d.number())[d.OUTPUT]);

expectType<111 | 222>(d.enum([111, 222]).not(d.const(222))[d.INPUT]);

expectType<111 | 222>(d.enum([111, 222]).not(d.const(222))[d.OUTPUT]);

// exclude()

expectType<111 | 222>(d.enum([111, 222]).exclude(d.number())[d.INPUT]);

expectType<never>(d.enum([111, 222]).exclude(d.number())[d.OUTPUT]);

expectType<111 | 222>(d.enum([111, 222]).exclude(d.const(222))[d.INPUT]);

expectType<111>(d.enum([111, 222]).exclude(d.const(222))[d.OUTPUT]);

// parseOrDefault()

expectType<111 | 222 | 333>(d.enum([111, 222]).parseOrDefault('aaa', 333));

expectType<string | 111>(d.string().parseOrDefault('aaa', 111));

// parseOrDefaultAsync()

expectType<Promise<111 | 222 | 333>>(d.enum([111, 222]).parseOrDefaultAsync('aaa', 333));

expectType<Promise<string | 111>>(d.string().parseOrDefaultAsync('aaa', 111));
