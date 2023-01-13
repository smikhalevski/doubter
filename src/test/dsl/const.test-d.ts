import { expectType } from 'tsd';
import * as d from '../../main';

expectType<111>(d.const(111).output);
