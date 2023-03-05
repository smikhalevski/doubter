import * as d from 'doubter';
import { expectType } from 'tsd';

expectType<string | number | boolean>(d.or([d.string(), d.number(), d.boolean()]).output);

expectType<string>(d.or([d.string(), d.never()]).output);

expectType<any>(d.or([d.string(), d.any()]).output);

expectType<unknown>(d.or([d.string(), d.unknown()]).output);
