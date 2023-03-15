import * as d from 'doubter';
import { expectType } from 'tsd';

expectType<number>(d.finite().__output);

expectType<number>(d.finite().nan().__output);
