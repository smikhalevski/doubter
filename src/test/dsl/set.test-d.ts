import { expectNotAssignable, expectType } from 'tsd';
import * as d from '../../main';
import { INPUT, OUTPUT } from '../../main/internal/shapes';

expectType<Set<string | number>>(d.set(d.or([d.string(), d.number()]))[OUTPUT]);

expectType<Set<111>>(d.set(d.const(111))[OUTPUT]);

expectType<Set<string>>(d.set(d.string()).readonly()[INPUT]);

expectNotAssignable<Set<string>>(d.set(d.string()).readonly()[OUTPUT]);

expectType<ReadonlySet<string>>(d.set(d.string()).readonly()[OUTPUT]);
