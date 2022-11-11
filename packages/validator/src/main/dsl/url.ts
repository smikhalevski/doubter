import { Message, TypeConstraintOptions } from 'doubter';
import { UrlShape } from '../shapes';

export function url(options?: TypeConstraintOptions | Message): UrlShape {
  return new UrlShape(options);
}
