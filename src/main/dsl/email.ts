import { Message, TypeCheckOptions } from '../shared-types';
import { EmailShape } from '../shapes';

export function email(options?: TypeCheckOptions | Message): EmailShape {
  return new EmailShape(options);
}
