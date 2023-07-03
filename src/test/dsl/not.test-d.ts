import { expectType } from 'tsd';
import * as d from '../../main';
import { _OUTPUT } from '../../main/shape/Shape';

expectType<any>(d.not(d.string())[_OUTPUT]);
