import { Message, TypeConstraintOptions } from '../shared-types';
import { EmailShape } from '../shapes';

export function email(options?: TypeConstraintOptions | Message): EmailShape {
  return new EmailShape(options);
}
