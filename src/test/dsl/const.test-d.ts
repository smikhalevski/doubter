import { expectType } from 'tsd';
import * as d from '../../main/index.js';
import { type OUTPUT } from '../../main/shape/Shape.js';

declare const OUTPUT: OUTPUT;

expectType<111>(d.const(111)[OUTPUT]);
