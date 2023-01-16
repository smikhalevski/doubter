import { expectType } from 'tsd';
import * as d from '../../main';

expectType<Map<string, number>>(d.map(d.string(), d.number()).output);

expectType<Map<'bbb', number>>(
  d.map(
    d.string().transform((): 'bbb' => 'bbb'),
    d.number()
  ).output
);
