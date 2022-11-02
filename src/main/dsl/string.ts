import { StringShape } from '../shapes';
import { Message, TypeConstraintOptions } from '../shared-types';

export function string(options?: TypeConstraintOptions | Message): StringShape {
  return new StringShape(options);
}
