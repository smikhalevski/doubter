import { expectType } from 'tsd';
import * as d from '../../main';
import { _OUTPUT } from '../../main/shape/Shape';

expectType<{ key1: string } & { key2: number }>(
  d.and([d.object({ key1: d.string() }), d.object({ key2: d.number() })])[_OUTPUT]
);

expectType<string>(d.and([d.string(), d.string()])[_OUTPUT]);

expectType<string>(d.and([d.or([d.string(), d.number()]), d.string()])[_OUTPUT]);

expectType<string | number>(
  d.and([d.or([d.string(), d.number(), d.boolean()]), d.or([d.string(), d.number()])])[_OUTPUT]
);

expectType<never>(d.and([d.or([d.string(), d.never()]), d.number()])[_OUTPUT]);

expectType<any>(d.and([d.any(), d.string()])[_OUTPUT]);

expectType<never>(d.and([d.never(), d.string()])[_OUTPUT]);

expectType<never>(d.and([d.never(), d.any()])[_OUTPUT]);
