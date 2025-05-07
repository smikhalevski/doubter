import { expectNotAssignable, expectType } from 'tsd';
import * as d from '../../main/index.ts';
import { type INPUT, type OUTPUT } from '../../main/shape/Shape.ts';

declare const INPUT: INPUT;
declare const OUTPUT: OUTPUT;

expectType<Set<string | number>>(d.set(d.or([d.string(), d.number()]))[OUTPUT]);

expectType<Set<111>>(d.set(d.const(111))[OUTPUT]);

expectType<Set<string>>(d.set(d.string()).readonly()[INPUT]);

expectNotAssignable<Set<string>>(d.set(d.string()).readonly()[OUTPUT]);

expectType<ReadonlySet<string>>(d.set(d.string()).readonly()[OUTPUT]);
