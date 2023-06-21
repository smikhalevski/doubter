import * as d from 'doubter';
import { OUTPUT } from 'doubter';
import { expectNotType, expectType } from 'tsd';

expectType<[string, number]>(d.tuple([d.string(), d.number()])[OUTPUT]);

expectNotType<[string, number, ...unknown[]]>(d.tuple([d.string(), d.number()])[OUTPUT]);

expectType<number>(d.tuple([d.string(), d.number()]).headShapes[1][OUTPUT]);

expectType<[string, number, ...boolean[]]>(d.tuple([d.string(), d.number()], d.boolean())[OUTPUT]);
