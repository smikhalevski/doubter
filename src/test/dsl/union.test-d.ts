import { expectType } from 'tsd';
import * as d from '../../main';
import { _OUTPUT } from '../../main/shape/Shape';

expectType<string | number | boolean>(d.or([d.string(), d.number(), d.boolean()])[_OUTPUT]);

expectType<string>(d.or([d.string(), d.never()])[_OUTPUT]);

expectType<any>(d.or([d.string(), d.any()])[_OUTPUT]);

expectType<unknown>(d.or([d.string(), d.unknown()])[_OUTPUT]);
