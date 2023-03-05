import * as d from 'doubter';
import { expectType } from 'tsd';

expectType<Promise<Promise<string>>>(d.promise(d.string()).parseAsync(Promise.resolve('aaa')));
