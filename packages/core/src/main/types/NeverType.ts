import { Type } from './Type';
import { ParserContext } from '../ParserContext';
import { createIssue } from '../utils';

/**
 * The type definition that always raises an issue.
 */
export class NeverType extends Type<never> {
  _parse(input: unknown, context: ParserContext): any {
    context.raiseIssue(createIssue(context, 'never', input));
    return input;
  }
}
