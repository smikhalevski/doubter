import * as d from 'doubter';
import { expectType } from 'tsd';

expectType<any>(d.not(d.string())[d.OUTPUT]);
