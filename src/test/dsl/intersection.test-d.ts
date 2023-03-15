import * as d from 'doubter';
import { expectType } from 'tsd';

expectType<{ key1: string } & { key2: number }>(
  d.and([d.object({ key1: d.string() }), d.object({ key2: d.number() })]).__output
);

expectType<string>(d.and([d.string(), d.string()]).__output);

expectType<string>(d.and([d.or([d.string(), d.number()]), d.string()]).__output);

expectType<string | number>(
  d.and([d.or([d.string(), d.number(), d.boolean()]), d.or([d.string(), d.number()])]).__output
);

expectType<never>(d.and([d.or([d.string(), d.never()]), d.number()]).__output);

expectType<any>(d.and([d.any(), d.string()]).__output);

expectType<never>(d.and([d.never(), d.string()]).__output);

expectType<never>(d.and([d.never(), d.any()]).__output);
