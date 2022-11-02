import { UuidShape } from '../shapes';
import { Message, TypeConstraintOptions } from '../shared-types';

export function uuid(options?: TypeConstraintOptions | Message): UuidShape {
  return new UuidShape(options);
}
