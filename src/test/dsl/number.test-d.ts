import { expectType } from 'tsd';
import * as d from '../../main';
import { _INPUT, _OUTPUT } from '../../main/shape/Shape';

expectType<number | 'aaa'>(d.number().replace('aaa', true)[_INPUT]);

expectType<number | true>(d.number().replace('aaa', true)[_OUTPUT]);

expectType<number>(d.number().replace(222, 'aaa')[_INPUT]);

expectType<number | 'aaa'>(d.number().replace(222, 'aaa')[_OUTPUT]);

expectType<number>(d.number().replace(NaN, 0)[_INPUT]);

expectType<number>(d.number().replace(NaN, 0)[_OUTPUT]);

expectType<number>(d.number().nan()[_INPUT]);

expectType<number>(d.number().nan()[_OUTPUT]);

expectType<number>(d.number().nan(111)[_INPUT]);

expectType<number>(d.number().nan(111)[_OUTPUT]);

expectType<number>(d.number().nan('aaa')[_INPUT]);

expectType<number | 'aaa'>(d.number().nan('aaa')[_OUTPUT]);

expectType<number>(d.number().allow(Infinity)[_OUTPUT]);

expectType<number>(d.number().deny(111)[_INPUT]);

expectType<number>(d.number().deny(111)[_OUTPUT]);
