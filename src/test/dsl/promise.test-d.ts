import { expectType } from 'tsd';
import * as d from '../../main';

expectType<Promise<Promise<string>>>(d.promise(d.string()).parseAsync(Promise.resolve('aaa')));
