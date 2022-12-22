import { expectType } from 'tsd';
import * as d from '../../main';

expectType<Record<string, number>>(d.record(d.number()).parse(null));

expectType<{ bbb: number }>(
  d
    .record(
      d.string().transform((): 'bbb' => 'bbb'),
      d.number()
    )
    .parse(null)
);
