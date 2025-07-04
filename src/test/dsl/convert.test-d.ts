import { expectType } from 'tsd';
import * as d from '../../main/index.js';
import { type INPUT, type OUTPUT } from '../../main/shape/Shape.js';

declare const INPUT: INPUT;
declare const OUTPUT: OUTPUT;

expectType<any>(d.convert(() => 'aaa')[INPUT]);

expectType<string>(d.convert(() => 'aaa')[OUTPUT]);

const shape = d
  .object({
    years: d.array(d.string()).convert(years => years.map(parseFloat)),
  })
  .deepPartial();

expectType<{ years?: string[] }>(shape[INPUT]);

expectType<{ years?: number[] }>(shape[OUTPUT]);
