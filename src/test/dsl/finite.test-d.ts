import * as d from 'doubter';
import { expectType } from 'tsd';

expectType<number>(d.finite()[d.OUTPUT]);

expectType<number>(d.finite().nan()[d.OUTPUT]);
