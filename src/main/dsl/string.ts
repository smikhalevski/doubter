import { StringShape } from '../shapes';
import { Message, TypeCheckOptions } from '../shared-types';

export function string(options?: TypeCheckOptions | Message): StringShape {
  return new StringShape(options);
}
