import * as d from 'doubter';
import { expectType } from 'tsd';

expectType<[string, number]>(d.tuple([d.string(), d.number()]).output);

expectType<number>(d.tuple([d.string(), d.number()]).shapes[1].output);

expectType<[string, number, ...boolean[]]>(d.tuple([d.string(), d.number()], d.boolean()).output);
