import { expectType } from 'tsd';
import * as d from '../../main';

expectType<number>(d.finite().output);

expectType<number>(d.finite().nan().output);
