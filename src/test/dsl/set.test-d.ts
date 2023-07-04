import { expectType } from 'tsd';
import * as d from '../../main';
import { OUTPUT } from '../../main/shape/Shape';

expectType<Set<string | number>>(d.set(d.or([d.string(), d.number()]))[OUTPUT]);

expectType<Set<111>>(d.set(d.const(111))[OUTPUT]);
