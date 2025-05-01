import { expectType } from 'tsd';
import * as d from '../../main';
import { type INPUT, type OUTPUT } from '../../main/shape/Shape';

declare const INPUT: INPUT;
declare const OUTPUT: OUTPUT;

expectType<Date>(d.date().toISOString()[INPUT]);

expectType<string>(d.date().toISOString()[OUTPUT]);
