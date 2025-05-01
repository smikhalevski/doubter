import { expectType } from 'tsd';
import * as d from '../../main';
import { type OUTPUT } from '../../main/shape/Shape';

declare const OUTPUT: OUTPUT;

expectType<never>(d.never()[OUTPUT]);
