import { Type } from './Type';
import { ParserContext } from '../ParserContext';
import { createIssue } from '../utils';

/**
 * The boolean type definition.
 */
export class BooleanType extends Type<boolean> {
  _parse(input: unknown, context: ParserContext): any {
    if (typeof input !== 'boolean') {
      context.raiseIssue(createIssue(context, 'type', input, 'boolean'));
    }
    return input;
  }
}
