import { expectType } from 'tsd';
import * as d from '../../main';

expectType<number | 'aaa'>(d.number().replace('aaa', true).input);

expectType<number | true>(d.number().replace('aaa', true).output);

expectType<number>(d.number().replace(222, 'aaa').input);

expectType<number | 'aaa'>(d.number().replace(222, 'aaa').output);

expectType<number>(d.number().nan().output);

expectType<number>(d.number().include(Infinity).output);
