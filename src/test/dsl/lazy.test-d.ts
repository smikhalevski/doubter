import * as d from 'doubter';
import { expectType } from 'tsd';

expectType<string>(d.lazy(() => d.string()).__output);

expectType<string | number>(d.lazy(() => d.string().transform(parseFloat)).__output);

expectType<{ aaa?: string }>(d.lazy(() => d.object({ aaa: d.string().transform(parseFloat) })).deepPartial().__input);

expectType<{ aaa?: string } | { aaa?: number }>(
  d.lazy(() => d.object({ aaa: d.string().transform(parseFloat) })).deepPartial().__output
);

expectType<string | 111>(d.lazy(() => d.string()).circular(111).__output);
