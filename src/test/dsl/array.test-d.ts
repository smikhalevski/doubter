import * as d from 'doubter';
import { expectType } from 'tsd';

expectType<any[]>(d.array().input);

expectType<any[]>(d.array().output);

expectType<111[]>(d.array(d.const(111)).input);

expectType<111[]>(d.array(d.const(111)).output);

expectType<Array<number | undefined>>(d.array(d.number()).deepPartial().output);

expectType<Array<{ aaa?: number } | undefined>>(d.array(d.object({ aaa: d.number() })).deepPartial().output);
