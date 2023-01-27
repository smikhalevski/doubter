import { expectType } from 'tsd';
import * as d from 'doubter';

expectType<number>(d.lazy(() => d.string().transform(parseFloat)).output);
