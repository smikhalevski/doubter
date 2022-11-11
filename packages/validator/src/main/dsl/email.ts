import { Message, TypeConstraintOptions } from 'doubter';
import { UrlShape } from '../shapes';
import { EmailShape } from '../shapes/EmailShape';

export function email(options?: TypeConstraintOptions | Message): EmailShape {
  return new EmailShape(options);
}
