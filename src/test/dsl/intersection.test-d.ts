import { expectType } from 'tsd';
import * as d from '../../main';
import { INPUT, OUTPUT } from '../../main/internal/shapes';

expectType<{ key1: string } & { key2: number }>(
  d.and([d.object({ key1: d.string() }), d.object({ key2: d.number() })])[OUTPUT]
);

expectType<string>(d.and([d.string(), d.string()])[OUTPUT]);

expectType<string>(d.and([d.or([d.string(), d.number()]), d.string()])[OUTPUT]);

expectType<string | number>(
  d.and([d.or([d.string(), d.number(), d.boolean()]), d.or([d.string(), d.number()])])[OUTPUT]
);

expectType<never>(d.and([d.or([d.string(), d.never()]), d.number()])[OUTPUT]);

expectType<any>(d.and([d.any(), d.string()])[OUTPUT]);

expectType<never>(d.and([d.never(), d.string()])[OUTPUT]);

expectType<never>(d.and([d.never(), d.any()])[OUTPUT]);

expectType<never>(d.and([d.never()])[INPUT]);

expectType<never>(d.and([d.never()])[OUTPUT]);
