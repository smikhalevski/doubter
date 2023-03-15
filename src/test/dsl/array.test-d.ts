import * as d from 'doubter';
import { expectType } from 'tsd';

expectType<any[]>(d.array().__input);

expectType<any[]>(d.array().__output);

expectType<111[]>(d.array(d.const(111)).__input);

expectType<111[]>(d.array(d.const(111)).__output);

expectType<Array<number | undefined>>(d.array(d.number()).deepPartial().__output);

expectType<Array<{ aaa?: number } | undefined>>(d.array(d.object({ aaa: d.number() })).deepPartial().__output);
