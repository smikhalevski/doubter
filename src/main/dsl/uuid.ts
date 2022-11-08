import { StringShape } from '../shapes';
import { Message, TypeConstraintOptions } from '../shared-types';

const uuidRegex =
  /^([a-f0-9]{8}-[a-f0-9]{4}-[1-5][a-f0-9]{3}-[a-f0-9]{4}-[a-f0-9]{12}|00000000-0000-0000-0000-000000000000)$/i;

export function uuid(options?: TypeConstraintOptions | Message): StringShape {
  return new StringShape(options).match(uuidRegex);
}
