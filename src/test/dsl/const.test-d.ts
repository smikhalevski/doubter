import { expectType } from 'tsd';
import * as d from '../../main';
import { OUTPUT } from '../../main/shape/Shape';

expectType<111>(d.const(111)[OUTPUT]);
