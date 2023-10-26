import { expectType } from 'tsd';
import * as d from '../../main';
import { OUTPUT } from '../../main/internal/shapes';

expectType<never>(d.never()[OUTPUT]);
