import * as d from 'doubter';
import { expectNotType, expectType } from 'tsd';

expectType<[string, number]>(d.tuple([d.string(), d.number()])[d.OUTPUT]);

expectNotType<[string, number, ...unknown[]]>(d.tuple([d.string(), d.number()])[d.OUTPUT]);

expectType<number>(d.tuple([d.string(), d.number()]).headShapes[1][d.OUTPUT]);

expectType<[string, number, ...boolean[]]>(d.tuple([d.string(), d.number()], d.boolean())[d.OUTPUT]);
