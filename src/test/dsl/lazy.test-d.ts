import { expectType } from 'tsd';
import * as d from '../../main';
import { _INPUT, _OUTPUT } from '../../main/shape/Shape';

expectType<string>(d.lazy(() => d.string())[_OUTPUT]);

expectType<string | number>(d.lazy(() => d.string().convert(parseFloat))[_OUTPUT]);

expectType<{ aaa?: string }>(d.lazy(() => d.object({ aaa: d.string().convert(parseFloat) })).deepPartial()[_INPUT]);

expectType<{ aaa?: string } | { aaa?: number }>(
  d.lazy(() => d.object({ aaa: d.string().convert(parseFloat) })).deepPartial()[_OUTPUT]
);

expectType<string | 111>(d.lazy(() => d.string()).circular(111)[_OUTPUT]);

expectType<{ aaa: number } | 111>(
  d.lazy(() => d.object({ aaa: d.string().convert(parseFloat) })).circular(111)[_OUTPUT]
);

expectType<{ aaa?: string } | { aaa?: number }>(
  d
    .lazy(() => d.object({ aaa: d.string().convert(parseFloat) }))
    .circular(111)
    .deepPartial()[_OUTPUT]
);
