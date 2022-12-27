import { expectType } from 'tsd';
import * as d from '../../main';

expectType<111[]>(d.array(d.const(111)).parse(null));
