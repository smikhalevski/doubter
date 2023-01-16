import { expectType } from 'tsd';
import * as d from '../../main';

expectType<{ foo: string } & { bar: number }>(
  d.intersection([d.object({ foo: d.string() }), d.object({ bar: d.number() })]).output
);
