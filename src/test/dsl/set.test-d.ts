import { expectType } from 'tsd';
import * as d from '../../main';
import { _OUTPUT } from '../../main/shape/Shape';

expectType<Set<string | number>>(d.set(d.or([d.string(), d.number()]))[_OUTPUT]);

expectType<Set<111>>(d.set(d.const(111))[_OUTPUT]);
