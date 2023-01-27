import { expectType } from 'tsd';
import * as d from 'doubter';

expectType<number>(d.finite().output);

expectType<number>(d.finite().nan().output);
