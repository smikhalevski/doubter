import { expectType } from 'tsd';
import * as d from '../../main';
import { OUTPUT } from '../../main/shapes/Shape';

expectType<string | number | boolean>(d.or([d.string(), d.number(), d.boolean()])[OUTPUT]);

expectType<string>(d.or([d.string(), d.never()])[OUTPUT]);

expectType<any>(d.or([d.string(), d.any()])[OUTPUT]);

expectType<unknown>(d.or([d.string(), d.unknown()])[OUTPUT]);
