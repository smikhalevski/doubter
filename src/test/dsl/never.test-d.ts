import { expectType } from 'tsd';
import * as d from '../../main/index.ts';
import { type OUTPUT } from '../../main/shape/Shape.ts';

declare const OUTPUT: OUTPUT;

expectType<never>(d.never()[OUTPUT]);
