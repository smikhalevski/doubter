import { expectNotType, expectType } from 'tsd';
import * as d from '../../main';
import { type OUTPUT } from '../../main/shape/Shape';

declare const OUTPUT: OUTPUT;

expectType<[string, number]>(d.tuple([d.string(), d.number()])[OUTPUT]);

expectNotType<[string, number, ...unknown[]]>(d.tuple([d.string(), d.number()])[OUTPUT]);

expectType<number>(d.tuple([d.string(), d.number()]).headShapes[1][OUTPUT]);

expectType<[string, number, ...boolean[]]>(d.tuple([d.string(), d.number()], d.boolean())[OUTPUT]);
