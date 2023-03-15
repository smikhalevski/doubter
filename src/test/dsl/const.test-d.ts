import * as d from 'doubter';
import { expectType } from 'tsd';

expectType<111>(d.const(111).__output);
