import { expectType } from 'tsd';
import * as d from '../../main';

expectType<number | 'aaa'>(d.number().replace('aaa', true).input);

expectType<number | true>(d.number().replace('aaa', true).output);

expectType<number | 'aaa'>(d.number().replace(222, 'aaa').output);
