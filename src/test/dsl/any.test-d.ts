import { expectNotType, expectType } from 'tsd';
import * as d from '../../main';
import { _INPUT, _OUTPUT } from '../../main/shape/Shape';

expectType<111>(d.any((value): value is 111 => true)[_INPUT]);

expectType<111>(d.any((value): value is 111 => true)[_OUTPUT]);

expectType<string>(d.any<string>()[_INPUT]);

expectType<string>(d.any<string>()[_OUTPUT]);

expectType<string>(d.any<string>(() => true)[_INPUT]);

expectType<string>(d.any<string>(() => true)[_OUTPUT]);

// refine()

expectType<any>(d.any().refine((value: unknown): value is number => true)[_INPUT]);

expectType<number>(d.any().refine((value: unknown): value is number => true)[_OUTPUT]);

// ReplaceLiteralShape

expectType<string | null>(d.any<string>().nullable()[_OUTPUT]);

expectType<string | 111>(d.any<string>().nullable(111)[_OUTPUT]);

expectType<111 | 333>(d.any<111 | 222>().replace(222, 333)[_OUTPUT]);

expectType<111 | 222 | 333>(d.any<111 | 222>().replace(222 as number, 333)[_OUTPUT]);

expectType<number>(d.any<111 | 222>().replace(NaN, 333)[_INPUT]);

expectType<111 | 222 | 333>(d.any<111 | 222>().replace(NaN, 333)[_OUTPUT]);

// parse()

expectType<string | undefined>(d.any<string>().parseOrDefault(111));

expectType<string | true>(d.any<string>().parseOrDefault(111, true));

// CatchShape

expectType<number | undefined>(d.number().catch()[_OUTPUT]);

expectType<number | 'aaa'>(d.number().catch('aaa')[_OUTPUT]);

expectType<number | 'aaa'>(d.number().catch(() => 'aaa')[_OUTPUT]);

// deepPartial()

// ConvertShape is opaque for deepPartial
expectType<{ aaa?: { bbb: number } }>(
  d.object({ aaa: d.object({ bbb: d.number() }).convert(value => value) }).deepPartial()[_OUTPUT]
);

expectType<{ aaa?: string }>(
  d
    .object({ aaa: d.string().convert(parseFloat) })
    .to(d.object({ aaa: d.number() }))
    .deepPartial()[_INPUT]
);

expectType<{ aaa?: number }>(
  d
    .object({ aaa: d.string().convert(parseFloat) })
    .to(d.object({ aaa: d.number() }))
    .deepPartial()[_OUTPUT]
);

expectType<{ aaa?: string }>(
  d
    .or([d.object({ aaa: d.string() }), d.const(111)])
    .deny(111)
    .deepPartial()[_OUTPUT]
);

expectType<{ aaa?: string } | undefined>(d.object({ aaa: d.string() }).catch().deepPartial()[_OUTPUT]);

expectType<{ aaa?: string } | 111>(d.object({ aaa: d.string() }).catch(111).deepPartial()[_OUTPUT]);

// BrandShape

expectType<d.Branded<string, 'foo'>>(d.string().brand<'foo'>()[_OUTPUT]);

const brandShape = d.any<string>().brand();

expectType<d.Output<typeof brandShape>>(brandShape[_OUTPUT]);

expectType<d.Output<typeof brandShape>>(brandShape.parse('aaa'));

expectNotType<d.Output<typeof brandShape>>('aaa');

expectNotType<d.Output<typeof brandShape>>(d.any<string>().brand<'bbb'>()[_OUTPUT]);

// deepPartial is visible on branded shapes
expectType<{ aaa?: string }>(d.object({ aaa: d.string() }).brand().deepPartial()[_OUTPUT]);

// Branded shapes are transparent for deepPartial
expectType<{ aaa?: { bbb?: string } }>(d.object({ aaa: d.object({ bbb: d.string() }).brand() }).deepPartial()[_OUTPUT]);

// not()

expectType<111 | 222>(d.enum([111, 222]).not(d.number())[_INPUT]);

expectType<111 | 222>(d.enum([111, 222]).not(d.number())[_OUTPUT]);

expectType<111 | 222>(d.enum([111, 222]).not(d.const(222))[_INPUT]);

expectType<111 | 222>(d.enum([111, 222]).not(d.const(222))[_OUTPUT]);

// exclude()

expectType<111 | 222>(d.enum([111, 222]).exclude(d.number())[_INPUT]);

expectType<never>(d.enum([111, 222]).exclude(d.number())[_OUTPUT]);

expectType<111 | 222>(d.enum([111, 222]).exclude(d.const(222))[_INPUT]);

expectType<111>(d.enum([111, 222]).exclude(d.const(222))[_OUTPUT]);

// parseOrDefault()

expectType<111 | 222 | 333>(d.enum([111, 222]).parseOrDefault('aaa', 333));

expectType<string | 111>(d.string().parseOrDefault('aaa', 111));

// parseOrDefaultAsync()

expectType<Promise<111 | 222 | 333>>(d.enum([111, 222]).parseOrDefaultAsync('aaa', 333));

expectType<Promise<string | 111>>(d.string().parseOrDefaultAsync('aaa', 111));
