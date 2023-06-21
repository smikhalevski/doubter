import * as d from 'doubter';
import { INPUT, OUTPUT } from 'doubter';
import { expectType } from 'tsd';

expectType<number | 'aaa'>(d.number().replace('aaa', true)[INPUT]);

expectType<number | true>(d.number().replace('aaa', true)[OUTPUT]);

expectType<number>(d.number().replace(222, 'aaa')[INPUT]);

expectType<number | 'aaa'>(d.number().replace(222, 'aaa')[OUTPUT]);

expectType<number>(d.number().replace(NaN, 0)[INPUT]);

expectType<number>(d.number().replace(NaN, 0)[OUTPUT]);

expectType<number>(d.number().nan()[INPUT]);

expectType<number>(d.number().nan()[OUTPUT]);

expectType<number>(d.number().nan(111)[INPUT]);

expectType<number>(d.number().nan(111)[OUTPUT]);

expectType<number>(d.number().nan('aaa')[INPUT]);

expectType<number | 'aaa'>(d.number().nan('aaa')[OUTPUT]);

expectType<number>(d.number().allow(Infinity)[OUTPUT]);

expectType<number>(d.number().deny(111)[INPUT]);

expectType<number>(d.number().deny(111)[OUTPUT]);
