import { expectNotType, expectType } from 'tsd';
import * as d from '../../main';
import { _OUTPUT } from '../../main/shape/Shape';

expectType<[string, number]>(d.tuple([d.string(), d.number()])[_OUTPUT]);

expectNotType<[string, number, ...unknown[]]>(d.tuple([d.string(), d.number()])[_OUTPUT]);

expectType<number>(d.tuple([d.string(), d.number()]).headShapes[1][_OUTPUT]);

expectType<[string, number, ...boolean[]]>(d.tuple([d.string(), d.number()], d.boolean())[_OUTPUT]);
