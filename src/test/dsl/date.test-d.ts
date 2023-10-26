import { expectType } from 'tsd';
import * as d from '../../main';
import { INPUT, OUTPUT } from '../../main/internal/shapes';

expectType<Date>(d.date().toISOString()[INPUT]);

expectType<string>(d.date().toISOString()[OUTPUT]);
