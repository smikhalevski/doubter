import * as d from 'doubter';
import { OUTPUT } from 'doubter';
import { expectType } from 'tsd';

expectType<any>(d.not(d.string())[OUTPUT]);
