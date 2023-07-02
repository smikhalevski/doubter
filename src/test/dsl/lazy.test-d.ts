import * as d from 'doubter';
import { expectType } from 'tsd';

expectType<string>(d.lazy(() => d.string())[d.OUTPUT]);

expectType<string | number>(d.lazy(() => d.string().convert(parseFloat))[d.OUTPUT]);

expectType<{ aaa?: string }>(d.lazy(() => d.object({ aaa: d.string().convert(parseFloat) })).deepPartial()[d.INPUT]);

expectType<{ aaa?: string } | { aaa?: number }>(
  d.lazy(() => d.object({ aaa: d.string().convert(parseFloat) })).deepPartial()[d.OUTPUT]
);

expectType<string | 111>(d.lazy(() => d.string()).circular(111)[d.OUTPUT]);

expectType<{ aaa: number } | 111>(
  d.lazy(() => d.object({ aaa: d.string().convert(parseFloat) })).circular(111)[d.OUTPUT]
);

expectType<{ aaa?: string } | { aaa?: number }>(
  d
    .lazy(() => d.object({ aaa: d.string().convert(parseFloat) }))
    .circular(111)
    .deepPartial()[d.OUTPUT]
);
