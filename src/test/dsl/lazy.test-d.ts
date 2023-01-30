import { expectType } from 'tsd';
import * as d from 'doubter';

expectType<number>(d.lazy(() => d.string().transform(parseFloat)).output);

expectType<{ aaa?: string }>(d.lazy(() => d.object({ aaa: d.string().transform(parseFloat) })).deepPartial().input);

expectType<{ aaa?: number }>(d.lazy(() => d.object({ aaa: d.string().transform(parseFloat) })).deepPartial().output);
