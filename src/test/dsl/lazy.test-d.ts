import { expectType } from 'tsd';
import * as d from '../../main/index.ts';
import { type INPUT, type OUTPUT } from '../../main/shape/Shape.ts';

declare const INPUT: INPUT;
declare const OUTPUT: OUTPUT;

expectType<string>(d.lazy(() => d.string())[OUTPUT]);

expectType<string | number>(d.lazy(() => d.string().convert(parseFloat))[OUTPUT]);

expectType<{ aaa?: string }>(d.lazy(() => d.object({ aaa: d.string().convert(parseFloat) })).deepPartial()[INPUT]);

expectType<{ aaa?: string } | { aaa?: number }>(
  d.lazy(() => d.object({ aaa: d.string().convert(parseFloat) })).deepPartial()[OUTPUT]
);

expectType<string | 111>(d.lazy(() => d.string()).circular(111)[OUTPUT]);

expectType<{ aaa: number } | 111>(
  d.lazy(() => d.object({ aaa: d.string().convert(parseFloat) })).circular(111)[OUTPUT]
);

expectType<{ aaa?: string } | { aaa?: number }>(
  d
    .lazy(() => d.object({ aaa: d.string().convert(parseFloat) }))
    .circular(111)
    .deepPartial()[OUTPUT]
);
