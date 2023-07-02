import * as d from 'doubter';
import { expectType } from 'tsd';

expectType<Record<string, number>>(d.record(d.number())[d.OUTPUT]);

expectType<{ bbb: number }>(
  d.record(
    d.string().convert((): 'bbb' => 'bbb'),
    d.number()
  )[d.OUTPUT]
);

expectType<Record<string, boolean | undefined>>(d.record(d.string(), d.boolean().optional())[d.OUTPUT]);
