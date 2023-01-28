import { expectNotType, expectType } from 'tsd';
import * as d from 'doubter';

expectType<111>(d.any((value): value is 111 => true).output);

expectType<string | null>(d.any<string>().nullable().output);

expectType<string | 111>(d.any<string>().nullable(111).output);

expectType<string | undefined>(d.any<string>().parseOrDefault(111));

expectType<string | true>(d.any<string>().parseOrDefault(111, true));

const brandShape = d.any<string>().brand();

expectType<(typeof brandShape)['output']>(brandShape.output);

expectNotType<(typeof brandShape)['output']>('aaa');

expectType<number | undefined>(d.number().catch().output);

expectType<number | 'aaa'>(d.number().catch('aaa').output);

expectType<number | 'aaa'>(d.number().catch(() => 'aaa').output);

// TransformShape is opaque for deep partial
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
    .exclude(111)
    .deepPartial().output
);

expectType<{ aaa?: string } | undefined>(d.object({ aaa: d.string() }).catch().deepPartial().output);

expectType<{ aaa?: string } | 111>(d.object({ aaa: d.string() }).catch(111).deepPartial().output);
