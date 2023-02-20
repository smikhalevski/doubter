import { expectType } from 'tsd';
import * as d from 'doubter';

expectType<string | number | boolean>(d.or([d.string(), d.number(), d.boolean()]).output);

expectType<string>(d.or([d.string(), d.never()]).output);

expectType<any>(d.or([d.string(), d.any()]).output);

expectType<unknown>(d.or([d.string(), d.unknown()]).output);
