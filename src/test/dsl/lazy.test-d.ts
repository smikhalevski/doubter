import { expectType } from 'tsd';
import * as d from '../../main';
import { INPUT, OUTPUT } from '../../main/shapes/Shape';

expectType<number>(d.lazy(() => d.string().transform(parseFloat))[OUTPUT]);

expectType<{ aaa?: string }>(d.lazy(() => d.object({ aaa: d.string().transform(parseFloat) })).deepPartial()[INPUT]);

expectType<{ aaa?: number }>(d.lazy(() => d.object({ aaa: d.string().transform(parseFloat) })).deepPartial()[OUTPUT]);
