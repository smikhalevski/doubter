import { expectNotType, expectType } from 'tsd';
import * as d from 'doubter';

expectType<111>(d.any((value): value is 111 => true).input);

expectType<111>(d.any((value): value is 111 => true).output);

expectType<string>(d.any<string>().input);

expectType<string>(d.any<string>().output);

expectType<string>(d.any<string>(() => true).input);

expectType<string>(d.any<string>(() => true).output);

// refine()

expectType<any>(d.any().refine((value: unknown): value is number => true).input);

expectType<number>(d.any().refine((value: unknown): value is number => true).output);

// ReplaceLiteralShape

expectType<string | null>(d.any<string>().nullable().output);

expectType<string | 111>(d.any<string>().nullable(111).output);

// parse()

expectType<string | undefined>(d.any<string>().parseOrDefault(111));

expectType<string | true>(d.any<string>().parseOrDefault(111, true));

// CatchShape

expectType<number | undefined>(d.number().catch().output);

expectType<number | 'aaa'>(d.number().catch('aaa').output);

expectType<number | 'aaa'>(d.number().catch(() => 'aaa').output);

// deepPartial()

// TransformShape is opaque for deepPartial
expectType<{ aaa?: { bbb: number } }>(
  d.object({ aaa: d.object({ bbb: d.number() }).transform(value => value) }).deepPartial().output
);

expectType<{ aaa?: string }>(
  d
    .object({ aaa: d.string().transform(parseFloat) })
    .to(d.object({ aaa: d.number() }))
    .deepPartial().input
);

expectType<{ aaa?: number }>(
  d
    .object({ aaa: d.string().transform(parseFloat) })
    .to(d.object({ aaa: d.number() }))
    .deepPartial().output
);

expectType<{ aaa?: string }>(
  d
    .or([d.object({ aaa: d.string() }), d.const(111)])
    .deny(111)
    .deepPartial().output
);

expectType<{ aaa?: string } | undefined>(d.object({ aaa: d.string() }).catch().deepPartial().output);

expectType<{ aaa?: string } | 111>(d.object({ aaa: d.string() }).catch(111).deepPartial().output);

// BrandShape

const brandShape = d.any<string>().brand();

expectType<(typeof brandShape)['output']>(brandShape.output);

expectType<(typeof brandShape)['output']>(brandShape.parse('aaa'));

expectNotType<(typeof brandShape)['output']>('aaa');

expectNotType<(typeof brandShape)['output']>(d.any<string>().brand<'bbb'>().output);

// deepPartial is visible on branded shapes
expectType<{ aaa?: string }>(d.object({ aaa: d.string() }).brand().deepPartial().output);

// Branded shapes are transparent for deepPartial
expectType<{ aaa?: { bbb?: string } }>(d.object({ aaa: d.object({ bbb: d.string() }).brand() }).deepPartial().output);

// ExcludeShape

expectType<111 | 222>(d.enum([111, 222]).not(d.const(222)).output);

expectType<111>(d.enum([111, 222]).exclude(d.const(222)).output);
