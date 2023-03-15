import * as d from 'doubter';
import { expectType } from 'tsd';

expectType<Record<string, number>>(d.record(d.number()).__output);

expectType<{ bbb: number }>(
  d.record(
    d.string().transform((): 'bbb' => 'bbb'),
    d.number()
  ).__output
);

expectType<Record<string, boolean | undefined>>(d.record(d.string(), d.boolean().optional()).__output);
