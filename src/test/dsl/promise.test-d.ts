import { expectType } from 'tsd';
import * as d from 'doubter';

expectType<Promise<Promise<string>>>(d.promise(d.string()).parseAsync(Promise.resolve('aaa')));
