import * as d from 'doubter';
import { expectType } from 'tsd';

expectType<string | number | boolean>(d.or([d.string(), d.number(), d.boolean()]).__output);

expectType<string>(d.or([d.string(), d.never()]).__output);

expectType<any>(d.or([d.string(), d.any()]).__output);

expectType<unknown>(d.or([d.string(), d.unknown()]).__output);
