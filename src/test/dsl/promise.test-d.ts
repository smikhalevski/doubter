import * as d from 'doubter';
import { expectType } from 'tsd';

expectType<Promise<any>>(d.promise().parse(Promise.resolve('aaa')));

expectType<Promise<string>>(d.promise(d.string()).parseAsync(Promise.resolve('aaa')));
