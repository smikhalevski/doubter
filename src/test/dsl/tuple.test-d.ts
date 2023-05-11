import * as d from 'doubter';
import { expectType, expectNotType } from 'tsd';

expectType<[string, number]>(d.tuple([d.string(), d.number()]).__output);

expectNotType<[string, number, ...unknown[]]>(d.tuple([d.string(), d.number()]).__output);

expectType<number>(d.tuple([d.string(), d.number()]).shapes[1].__output);

expectType<[string, number, ...boolean[]]>(d.tuple([d.string(), d.number()], d.boolean()).__output);
