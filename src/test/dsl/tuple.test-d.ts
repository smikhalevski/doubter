import { expectType } from 'tsd';
import * as d from 'doubter';

expectType<[string, number]>(d.tuple([d.string(), d.number()]).output);

expectType<number>(d.tuple([d.string(), d.number()]).shapes[1].output);

expectType<[string, number, ...boolean[]]>(d.tuple([d.string(), d.number()], d.boolean()).output);
