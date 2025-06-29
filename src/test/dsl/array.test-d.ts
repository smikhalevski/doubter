import { expectNotAssignable, expectType } from 'tsd';
import * as d from '../../main/index.js';
import { type INPUT, type OUTPUT } from '../../main/shape/Shape.js';

declare const INPUT: INPUT;
declare const OUTPUT: OUTPUT;

expectType<any[]>(d.array()[INPUT]);

expectType<any[]>(d.array()[OUTPUT]);

expectType<111[]>(d.array(d.const(111))[INPUT]);

expectType<111[]>(d.array(d.const(111))[OUTPUT]);

expectType<Array<number | undefined>>(d.array(d.number()).deepPartial()[OUTPUT]);

expectType<Array<{ aaa?: number } | undefined>>(d.array(d.object({ aaa: d.number() })).deepPartial()[OUTPUT]);

expectType<string[]>(d.array(d.string()).readonly()[INPUT]);

expectNotAssignable<string[]>(d.array(d.string()).readonly()[OUTPUT]);

expectType<readonly string[]>(d.array(d.string()).readonly()[OUTPUT]);
