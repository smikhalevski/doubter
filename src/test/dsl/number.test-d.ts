import * as d from 'doubter';
import { expectType } from 'tsd';

expectType<number | 'aaa'>(d.number().replace('aaa', true).__input);

expectType<number | true>(d.number().replace('aaa', true).__output);

expectType<number>(d.number().replace(222, 'aaa').__input);

expectType<number | 'aaa'>(d.number().replace(222, 'aaa').__output);

expectType<number>(d.number().replace(NaN, 0).__input);

expectType<number>(d.number().replace(NaN, 0).__output);

expectType<number>(d.number().nan().__input);

expectType<number>(d.number().nan().__output);

expectType<number>(d.number().nan(111).__input);

expectType<number>(d.number().nan(111).__output);

expectType<number>(d.number().nan('aaa').__input);

expectType<number | 'aaa'>(d.number().nan('aaa').__output);

expectType<number>(d.number().allow(Infinity).__output);

expectType<number>(d.number().deny(111).__input);

expectType<number>(d.number().deny(111).__output);
