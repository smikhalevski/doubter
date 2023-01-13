import { expectType } from 'tsd';
import * as d from '../../main';

expectType<number>(d.lazy(() => d.string().transform(parseFloat)).output);
