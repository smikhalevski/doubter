import * as d from 'doubter';
import { expectType } from 'tsd';

expectType<number>(d.finite().output);

expectType<number>(d.finite().nan().output);
