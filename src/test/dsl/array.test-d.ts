import { expectType } from 'tsd';
import * as d from 'doubter';

expectType<any[]>(d.array().input);

expectType<any[]>(d.array().output);

expectType<111[]>(d.array(d.const(111)).input);

expectType<111[]>(d.array(d.const(111)).output);

expectType<Array<number | undefined>>(d.array(d.number()).partialDeep().output);
