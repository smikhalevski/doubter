import { expectType } from 'tsd';
import * as d from '../../main';
import { _OUTPUT } from '../../main/shape/Shape';

expectType<111>(d.const(111)[_OUTPUT]);
