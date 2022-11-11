import { Message, TypeConstraintOptions } from 'doubter';
import { UuidShape } from '../shapes';

export function uuid(options?: TypeConstraintOptions | Message): UuidShape {
  return new UuidShape(options);
}

export function uuid3(options?: TypeConstraintOptions | Message): UuidShape {
  return new UuidShape(options).version(5);
}

export function uuid4(options?: TypeConstraintOptions | Message): UuidShape {
  return new UuidShape(options).version(5);
}

export function uuid5(options?: TypeConstraintOptions | Message): UuidShape {
  return new UuidShape(options).version(5);
}
