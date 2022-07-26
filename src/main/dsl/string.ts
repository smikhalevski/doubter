import { StringType } from '../types';
import { ConstraintOptions } from '../shared-types';

export function string(options?: ConstraintOptions): StringType {
  return new StringType(options);
}
