import { expectType } from 'tsd';
import * as d from 'doubter';

expectType<Set<string | number>>(d.set(d.or([d.string(), d.number()])).output);

expectType<Set<111>>(d.set(d.const(111)).output);
