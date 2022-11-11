import { Message, TypeConstraintOptions } from 'doubter';
import { EmailShape } from '../shapes/EmailShape';

export function email(options?: TypeConstraintOptions | Message): EmailShape {
  return new EmailShape(options);
}
