import * as d from 'doubter';
import { expectType } from 'tsd';

expectType<string | number | boolean>(d.or([d.string(), d.number(), d.boolean()])[d.OUTPUT]);

expectType<string>(d.or([d.string(), d.never()])[d.OUTPUT]);

expectType<any>(d.or([d.string(), d.any()])[d.OUTPUT]);

expectType<unknown>(d.or([d.string(), d.unknown()])[d.OUTPUT]);
