import { UuidShape } from '../shapes';
import { Message, TypeCheckOptions } from '../shared-types';

export function uuid(options?: TypeCheckOptions | Message): UuidShape {
  return new UuidShape(options);
}
