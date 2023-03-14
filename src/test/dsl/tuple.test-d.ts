import { expectType } from 'tsd';
import * as d from '../../main';
import { OUTPUT } from '../../main/shapes/Shape';

expectType<[string, number]>(d.tuple([d.string(), d.number()])[OUTPUT]);

expectType<number>(d.tuple([d.string(), d.number()]).shapes[1][OUTPUT]);

expectType<[string, number, ...boolean[]]>(d.tuple([d.string(), d.number()], d.boolean())[OUTPUT]);
