import { expectType } from 'tsd';
import * as d from '../../main';
import { INPUT, OUTPUT } from '../../main/internal';

expectType<any>(d.convert(() => 'aaa')[INPUT]);

expectType<string>(d.convert(() => 'aaa')[OUTPUT]);

const shape = d
  .object({
    years: d.array(d.string()).convert(years => years.map(parseFloat)),
  })
  .deepPartial();

expectType<{ years?: string[] }>(shape[INPUT]);

expectType<{ years?: number[] }>(shape[OUTPUT]);
