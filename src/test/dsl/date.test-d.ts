import { expectType } from 'tsd';
import * as d from '../../main';
import { INPUT, OUTPUT } from '../../main/internal';

expectType<Date>(d.date().iso()[INPUT]);

expectType<string>(d.date().iso()[OUTPUT]);
