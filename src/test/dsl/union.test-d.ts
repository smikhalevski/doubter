import { expectType } from 'tsd';
import * as d from '../../main/index.js';
import { type OUTPUT } from '../../main/shape/Shape.js';

declare const OUTPUT: OUTPUT;

expectType<string | number | boolean>(d.or([d.string(), d.number(), d.boolean()])[OUTPUT]);

expectType<string>(d.or([d.string(), d.never()])[OUTPUT]);

expectType<any>(d.or([d.string(), d.any()])[OUTPUT]);

expectType<unknown>(d.or([d.string(), d.unknown()])[OUTPUT]);
