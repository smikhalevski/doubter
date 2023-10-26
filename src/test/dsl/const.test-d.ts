import { expectType } from 'tsd';
import * as d from '../../main';
import { OUTPUT } from '../../main/internal/shapes';

expectType<111>(d.const(111)[OUTPUT]);
