import { StringShape } from '../shapes';
import { Message, TypeConstraintOptions } from '../shared-types';

const cuidRegex = /^[cC][^\s-]{8,}$/;

export function cuid(options?: TypeConstraintOptions | Message): StringShape {
  return new StringShape(options).regex(cuidRegex);
}
