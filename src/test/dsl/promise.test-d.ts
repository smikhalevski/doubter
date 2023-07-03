import { expectType } from 'tsd';
import * as d from '../../main';

expectType<Promise<any>>(d.promise().parse(Promise.resolve('aaa')));

expectType<Promise<string>>(d.promise(d.string()).parseAsync(Promise.resolve('aaa')));
