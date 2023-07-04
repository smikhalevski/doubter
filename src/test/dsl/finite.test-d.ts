import { expectType } from 'tsd';
import * as d from '../../main';
import { OUTPUT } from '../../main/shape/Shape';

expectType<number>(d.finite()[OUTPUT]);

expectType<number>(d.finite().nan()[OUTPUT]);
