import { expectType } from 'tsd';
import * as d from '../../main';

expectType<[string, number]>(d.tuple([d.string(), d.number()]).output);

expectType<[string, number, ...boolean[]]>(d.tuple([d.string(), d.number()], d.boolean()).output);
