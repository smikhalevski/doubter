import { expectType } from 'tsd';
import * as d from 'doubter';

expectType<111>(d.const(111).output);
