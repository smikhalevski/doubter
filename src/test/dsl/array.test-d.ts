import * as d from 'doubter';
import { expectType } from 'tsd';

expectType<any[]>(d.array()[d.INPUT]);

expectType<any[]>(d.array()[d.OUTPUT]);

expectType<111[]>(d.array(d.const(111))[d.INPUT]);

expectType<111[]>(d.array(d.const(111))[d.OUTPUT]);

expectType<Array<number | undefined>>(d.array(d.number()).deepPartial()[d.OUTPUT]);

expectType<Array<{ aaa?: number } | undefined>>(d.array(d.object({ aaa: d.number() })).deepPartial()[d.OUTPUT]);
