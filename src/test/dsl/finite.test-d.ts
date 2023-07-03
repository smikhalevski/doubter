import { expectType } from 'tsd';
import * as d from '../../main';
import { _OUTPUT } from '../../main/shape/Shape';

expectType<number>(d.finite()[_OUTPUT]);

expectType<number>(d.finite().nan()[_OUTPUT]);
