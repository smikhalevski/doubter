import { expectType } from 'tsd';
import * as d from '../../main';
import { _OUTPUT } from '../../main/shape/Shape';

expectType<Record<string, number>>(d.record(d.number())[_OUTPUT]);

expectType<{ bbb: number }>(
  d.record(
    d.string().convert((): 'bbb' => 'bbb'),
    d.number()
  )[_OUTPUT]
);

expectType<Record<string, boolean | undefined>>(d.record(d.string(), d.boolean().optional())[_OUTPUT]);
