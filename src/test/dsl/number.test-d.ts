import * as d from 'doubter';
import { expectType } from 'tsd';

expectType<number | 'aaa'>(d.number().replace('aaa', true).input);

expectType<number | true>(d.number().replace('aaa', true).output);

expectType<number>(d.number().replace(222, 'aaa').input);

expectType<number | 'aaa'>(d.number().replace(222, 'aaa').output);

expectType<number>(d.number().replace(NaN, 0).input);

expectType<number>(d.number().replace(NaN, 0).output);

expectType<number>(d.number().nan().output);

expectType<number>(d.number().allow(Infinity).output);

expectType<number>(d.number().deny(111).input);

expectType<number>(d.number().deny(111).output);
