import { StringShape } from '../shapes';
import { InputConstraintOptionsOrMessage } from '../shared-types';

export function string(options?: InputConstraintOptionsOrMessage): StringShape {
  return new StringShape(options);
}
