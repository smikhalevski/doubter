import { expectType } from 'tsd';
import * as d from '../../main';

expectType<[string, number]>(d.tuple([d.string(), d.number()]).parse(null));

expectType<[string, number, ...boolean[]]>(d.tuple([d.string(), d.number()], d.boolean()).parse(null));
