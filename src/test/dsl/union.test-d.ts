import { expectType } from 'tsd';
import * as d from 'doubter';

expectType<number | string>(d.or([d.number(), d.string()]).output);

expectType<{ key1: string } | { key2: number }>(
  d.or([d.object({ key1: d.string() }), d.object({ key2: d.number() })]).output
);
