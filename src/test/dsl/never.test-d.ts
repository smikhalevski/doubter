import { expectType } from 'tsd';
import * as d from '../../main';
import { OUTPUT } from '../../main/internal';

expectType<never>(d.never()[OUTPUT]);
