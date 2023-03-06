import * as d from 'doubter';
import { expectType } from 'tsd';

expectType<Set<string | number>>(d.set(d.or([d.string(), d.number()])).output);

expectType<Set<111>>(d.set(d.const(111)).output);
