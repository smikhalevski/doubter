import * as d from 'doubter';
import { OUTPUT } from 'doubter';
import { expectType } from 'tsd';

expectType<number>(d.finite()[OUTPUT]);

expectType<number>(d.finite().nan()[OUTPUT]);
