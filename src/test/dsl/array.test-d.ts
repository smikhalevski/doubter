import * as d from 'doubter';
import { INPUT, OUTPUT } from 'doubter';
import { expectType } from 'tsd';

expectType<any[]>(d.array()[INPUT]);

expectType<any[]>(d.array()[OUTPUT]);

expectType<111[]>(d.array(d.const(111))[INPUT]);

expectType<111[]>(d.array(d.const(111))[OUTPUT]);

expectType<Array<number | undefined>>(d.array(d.number()).deepPartial()[OUTPUT]);

expectType<Array<{ aaa?: number } | undefined>>(d.array(d.object({ aaa: d.number() })).deepPartial()[OUTPUT]);
