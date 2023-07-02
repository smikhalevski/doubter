import * as d from 'doubter';
import { expectType } from 'tsd';

expectType<number | 'aaa'>(d.number().replace('aaa', true)[d.INPUT]);

expectType<number | true>(d.number().replace('aaa', true)[d.OUTPUT]);

expectType<number>(d.number().replace(222, 'aaa')[d.INPUT]);

expectType<number | 'aaa'>(d.number().replace(222, 'aaa')[d.OUTPUT]);

expectType<number>(d.number().replace(NaN, 0)[d.INPUT]);

expectType<number>(d.number().replace(NaN, 0)[d.OUTPUT]);

expectType<number>(d.number().nan()[d.INPUT]);

expectType<number>(d.number().nan()[d.OUTPUT]);

expectType<number>(d.number().nan(111)[d.INPUT]);

expectType<number>(d.number().nan(111)[d.OUTPUT]);

expectType<number>(d.number().nan('aaa')[d.INPUT]);

expectType<number | 'aaa'>(d.number().nan('aaa')[d.OUTPUT]);

expectType<number>(d.number().allow(Infinity)[d.OUTPUT]);

expectType<number>(d.number().deny(111)[d.INPUT]);

expectType<number>(d.number().deny(111)[d.OUTPUT]);
