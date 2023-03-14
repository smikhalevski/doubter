import { expectType } from 'tsd';
import * as d from '../../main';
import { OUTPUT } from '../../main/shapes/Shape';

expectType<any>(d.not(d.string())[OUTPUT]);
