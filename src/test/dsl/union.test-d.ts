import { expectType } from 'tsd';
import * as d from '../../main';

expectType<number | string>(d.or([d.number(), d.string()]).output);

expectType<{ foo: string } | { foo: number }>(
  d.or([d.object({ foo: d.string() }), d.object({ foo: d.number() })]).parse(null)
);
