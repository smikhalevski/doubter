import { expectNotType, expectType } from 'tsd';
import * as d from '../../main';
import { INPUT, OUTPUT } from '../../main/shapes/Shape';

expectType<111>(d.any((value): value is 111 => true)[INPUT]);

expectType<111>(d.any((value): value is 111 => true)[OUTPUT]);

expectType<string>(d.any<string>()[INPUT]);

expectType<string>(d.any<string>()[OUTPUT]);

expectType<string>(d.any<string>(() => true)[INPUT]);

expectType<string>(d.any<string>(() => true)[OUTPUT]);

// refine()

expectType<any>(d.any().refine((value: unknown): value is number => true)[INPUT]);

expectType<number>(d.any().refine((value: unknown): value is number => true)[OUTPUT]);

// ReplaceLiteralShape

expectType<string | null>(d.any<string>().nullable()[OUTPUT]);

expectType<string | 111>(d.any<string>().nullable(111)[OUTPUT]);

expectType<111 | 333>(d.any<111 | 222>().replace(222, 333)[OUTPUT]);

expectType<111 | 222 | 333>(d.any<111 | 222>().replace(222 as number, 333)[OUTPUT]);

expectType<number>(d.any<111 | 222>().replace(NaN, 333)[INPUT]);

expectType<111 | 222 | 333>(d.any<111 | 222>().replace(NaN, 333)[OUTPUT]);

// parse()

expectType<string | undefined>(d.any<string>().parseOrDefault(111));

expectType<string | true>(d.any<string>().parseOrDefault(111, true));

// CatchShape

expectType<number | undefined>(d.number().catch()[OUTPUT]);

expectType<number | 'aaa'>(d.number().catch('aaa')[OUTPUT]);

expectType<number | 'aaa'>(d.number().catch(() => 'aaa')[OUTPUT]);

// deepPartial()

// TransformShape is opaque for deepPartial
expectType<{ aaa?: { bbb: number } }>(
  d.object({ aaa: d.object({ bbb: d.number() }).transform(value => value) }).deepPartial()[OUTPUT]
);

expectType<{ aaa?: string }>(
  d
    .object({ aaa: d.string().transform(parseFloat) })
    .to(d.object({ aaa: d.number() }))
    .deepPartial()[INPUT]
);

expectType<{ aaa?: number }>(
  d
    .object({ aaa: d.string().transform(parseFloat) })
    .to(d.object({ aaa: d.number() }))
    .deepPartial()[OUTPUT]
);

expectType<{ aaa?: string }>(
  d
    .or([d.object({ aaa: d.string() }), d.const(111)])
    .deny(111)
    .deepPartial()[OUTPUT]
);

expectType<{ aaa?: string } | undefined>(d.object({ aaa: d.string() }).catch().deepPartial()[OUTPUT]);

expectType<{ aaa?: string } | 111>(d.object({ aaa: d.string() }).catch(111).deepPartial()[OUTPUT]);

// BrandShape

expectType<d.Branded<string, 'foo'>>(d.string().brand<'foo'>()[OUTPUT]);

const brandShape = d.any<string>().brand();

expectType<d.Output<typeof brandShape>>(brandShape[OUTPUT]);

expectType<d.Output<typeof brandShape>>(brandShape.parse('aaa'));

expectNotType<d.Output<typeof brandShape>>('aaa');

expectNotType<d.Output<typeof brandShape>>(d.any<string>().brand<'bbb'>()[OUTPUT]);

// deepPartial is visible on branded shapes
expectType<{ aaa?: string }>(d.object({ aaa: d.string() }).brand().deepPartial()[OUTPUT]);

// Branded shapes are transparent for deepPartial
expectType<{ aaa?: { bbb?: string } }>(d.object({ aaa: d.object({ bbb: d.string() }).brand() }).deepPartial()[OUTPUT]);

// not()

expectType<111 | 222>(d.enum([111, 222]).not(d.number())[INPUT]);

expectType<111 | 222>(d.enum([111, 222]).not(d.number())[OUTPUT]);

expectType<111 | 222>(d.enum([111, 222]).not(d.const(222))[INPUT]);

expectType<111 | 222>(d.enum([111, 222]).not(d.const(222))[OUTPUT]);

// exclude()

expectType<111 | 222>(d.enum([111, 222]).exclude(d.number())[INPUT]);

expectType<never>(d.enum([111, 222]).exclude(d.number())[OUTPUT]);

expectType<111 | 222>(d.enum([111, 222]).exclude(d.const(222))[INPUT]);

expectType<111>(d.enum([111, 222]).exclude(d.const(222))[OUTPUT]);

// parseOrDefault()

expectType<111 | 222 | 333>(d.enum([111, 222]).parseOrDefault('aaa', 333));

expectType<string | 111>(d.string().parseOrDefault('aaa', 111));

// parseOrDefaultAsync()

expectType<Promise<111 | 222 | 333>>(d.enum([111, 222]).parseOrDefaultAsync('aaa', 333));

expectType<Promise<string | 111>>(d.string().parseOrDefaultAsync('aaa', 111));
