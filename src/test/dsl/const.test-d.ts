import * as d from 'doubter';
import { OUTPUT } from 'doubter';
import { expectType } from 'tsd';

expectType<111>(d.const(111)[OUTPUT]);
