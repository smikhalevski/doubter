import { expectType } from 'tsd';
import * as d from '../../main';
import { type OUTPUT } from '../../main/shape/Shape';

declare const OUTPUT: OUTPUT;

expectType<any>(d.not(d.string())[OUTPUT]);
