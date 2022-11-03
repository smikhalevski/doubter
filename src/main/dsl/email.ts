import { Message, TypeConstraintOptions } from '../shared-types';
import { StringShape } from '../shapes';

const emailRegex =
  /^(([^<>()[\].,;:\s@"]+(\.[^<>()[\].,;:\s@"]+)*)|(".+"))@(([^<>()[\].,;:\s@"]+\.)+[^<>()[\].,;:\s@"]{2,})$/;

export function email(options?: TypeConstraintOptions | Message): StringShape {
  return new StringShape(options).regex(emailRegex);
}
