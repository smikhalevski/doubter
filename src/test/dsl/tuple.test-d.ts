import * as d from 'doubter';
import { expectNotType, expectType } from 'tsd';

expectType<[string, number]>(d.tuple([d.string(), d.number()]).__output);

expectNotType<[string, number, ...unknown[]]>(d.tuple([d.string(), d.number()]).__output);

expectType<number>(d.tuple([d.string(), d.number()]).headShapes[1].__output);

expectType<[string, number, ...boolean[]]>(d.tuple([d.string(), d.number()], d.boolean()).__output);
