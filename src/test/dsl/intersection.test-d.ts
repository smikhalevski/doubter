import * as d from 'doubter';
import { expectType } from 'tsd';

expectType<{ key1: string } & { key2: number }>(
  d.and([d.object({ key1: d.string() }), d.object({ key2: d.number() })]).output
);

expectType<string>(d.and([d.string(), d.string()]).output);

expectType<string>(d.and([d.or([d.string(), d.number()]), d.string()]).output);

expectType<string | number>(
  d.and([d.or([d.string(), d.number(), d.boolean()]), d.or([d.string(), d.number()])]).output
);

expectType<never>(d.and([d.or([d.string(), d.never()]), d.number()]).output);

expectType<any>(d.and([d.any(), d.string()]).output);

expectType<never>(d.and([d.never(), d.string()]).output);

expectType<never>(d.and([d.never(), d.any()]).output);
