import { expectType } from 'tsd';
import * as d from '../../main';

expectType<{ key1: string } & { key2: number }>(
  d.intersection([d.object({ key1: d.string() }), d.object({ key2: d.number() })]).output
);
