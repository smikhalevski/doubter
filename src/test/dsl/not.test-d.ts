import { expectType } from 'tsd';
import * as d from 'doubter';

expectType<any>(d.not(d.string()).output);
