import * as d from 'doubter';
import { expectNotType, expectType } from 'tsd';

expectType<111>(d.any((value): value is 111 => true).__input);

expectType<111>(d.any((value): value is 111 => true).__output);

expectType<string>(d.any<string>().__input);

expectType<string>(d.any<string>().__output);

expectType<string>(d.any<string>(() => true).__input);

expectType<string>(d.any<string>(() => true).__output);

// refine()

expectType<any>(d.any().refine((value: unknown): value is number => true).__input);

expectType<number>(d.any().refine((value: unknown): value is number => true).__output);

// ReplaceLiteralShape

expectType<string | null>(d.any<string>().nullable().__output);

expectType<string | 111>(d.any<string>().nullable(111).__output);

expectType<111 | 333>(d.any<111 | 222>().replace(222, 333).__output);

expectType<111 | 222 | 333>(d.any<111 | 222>().replace(222 as number, 333).__output);

expectType<number>(d.any<111 | 222>().replace(NaN, 333).__input);

expectType<111 | 222 | 333>(d.any<111 | 222>().replace(NaN, 333).__output);

// parse()

expectType<string | undefined>(d.any<string>().parseOrDefault(111));

expectType<string | true>(d.any<string>().parseOrDefault(111, true));

// CatchShape

expectType<number | undefined>(d.number().catch().__output);

expectType<number | 'aaa'>(d.number().catch('aaa').__output);

expectType<number | 'aaa'>(d.number().catch(() => 'aaa').__output);

// deepPartial()

// TransformShape is opaque for deepPartial
expectType<{ aaa?: { bbb: number } }>(
  d.object({ aaa: d.object({ bbb: d.number() }).transform(value => value) }).deepPartial().__output
);

expectType<{ aaa?: string }>(
  d
    .object({ aaa: d.string().transform(parseFloat) })
    .to(d.object({ aaa: d.number() }))
    .deepPartial().__input
);

expectType<{ aaa?: number }>(
  d
    .object({ aaa: d.string().transform(parseFloat) })
    .to(d.object({ aaa: d.number() }))
    .deepPartial().__output
);

expectType<{ aaa?: string }>(
  d
    .or([d.object({ aaa: d.string() }), d.const(111)])
    .deny(111)
    .deepPartial().__output
);

expectType<{ aaa?: string } | undefined>(d.object({ aaa: d.string() }).catch().deepPartial().__output);

expectType<{ aaa?: string } | 111>(d.object({ aaa: d.string() }).catch(111).deepPartial().__output);

// BrandShape

expectType<d.Branded<string, 'foo'>>(d.string().brand<'foo'>().__output);

const brandShape = d.any<string>().brand();

expectType<d.Output<typeof brandShape>>(brandShape.__output);

expectType<d.Output<typeof brandShape>>(brandShape.parse('aaa'));

expectNotType<d.Output<typeof brandShape>>('aaa');

expectNotType<d.Output<typeof brandShape>>(d.any<string>().brand<'bbb'>().__output);

// deepPartial is visible on branded shapes
expectType<{ aaa?: string }>(d.object({ aaa: d.string() }).brand().deepPartial().__output);

// Branded shapes are transparent for deepPartial
expectType<{ aaa?: { bbb?: string } }>(d.object({ aaa: d.object({ bbb: d.string() }).brand() }).deepPartial().__output);

// not()

expectType<111 | 222>(d.enum([111, 222]).not(d.number()).__input);

expectType<111 | 222>(d.enum([111, 222]).not(d.number()).__output);

expectType<111 | 222>(d.enum([111, 222]).not(d.const(222)).__input);

expectType<111 | 222>(d.enum([111, 222]).not(d.const(222)).__output);

// exclude()

expectType<111 | 222>(d.enum([111, 222]).exclude(d.number()).__input);

expectType<never>(d.enum([111, 222]).exclude(d.number()).__output);

expectType<111 | 222>(d.enum([111, 222]).exclude(d.const(222)).__input);

expectType<111>(d.enum([111, 222]).exclude(d.const(222)).__output);

// parseOrDefault()

expectType<111 | 222 | 333>(d.enum([111, 222]).parseOrDefault('aaa', 333));

expectType<string | 111>(d.string().parseOrDefault('aaa', 111));

// parseOrDefaultAsync()

expectType<Promise<111 | 222 | 333>>(d.enum([111, 222]).parseOrDefaultAsync('aaa', 333));

expectType<Promise<string | 111>>(d.string().parseOrDefaultAsync('aaa', 111));
