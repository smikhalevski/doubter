import { StringShape } from '../shapes';
import { InputConstraintOptions } from '../shared-types';

export function string(options?: InputConstraintOptions): StringShape {
  return new StringShape(options);
}
