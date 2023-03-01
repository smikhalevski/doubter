import { expectType } from 'tsd';
import * as d from 'doubter';

expectType<Record<string, number>>(d.record(d.number()).output);

expectType<{ bbb: number }>(
  d.record(
    d.string().transform((): 'bbb' => 'bbb'),
    d.number()
  ).output
);

expectType<Record<string, boolean | undefined>>(d.record(d.string(), d.boolean().optional()).output);
