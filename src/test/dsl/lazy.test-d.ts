import * as d from 'doubter';
import { INPUT, OUTPUT } from 'doubter';
import { expectType } from 'tsd';

expectType<string>(d.lazy(() => d.string())[OUTPUT]);

expectType<string | number>(d.lazy(() => d.string().transform(parseFloat))[OUTPUT]);

expectType<{ aaa?: string }>(d.lazy(() => d.object({ aaa: d.string().transform(parseFloat) })).deepPartial()[INPUT]);

expectType<{ aaa?: string } | { aaa?: number }>(
  d.lazy(() => d.object({ aaa: d.string().transform(parseFloat) })).deepPartial()[OUTPUT]
);

expectType<string | 111>(d.lazy(() => d.string()).circular(111)[OUTPUT]);

expectType<{ aaa: number } | 111>(
  d.lazy(() => d.object({ aaa: d.string().transform(parseFloat) })).circular(111)[OUTPUT]
);

expectType<{ aaa?: string } | { aaa?: number }>(
  d
    .lazy(() => d.object({ aaa: d.string().transform(parseFloat) }))
    .circular(111)
    .deepPartial()[OUTPUT]
);
