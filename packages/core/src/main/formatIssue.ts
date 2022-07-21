import { Issue } from './shared-types';

/**
 * Formats the issue as a human-readable message.
 *
 * @param issue The issue to format.
 * @returns The human-readable message.
 */
export function formatIssue(issue: Issue): string {
  const { code, param } = issue;

  switch (code) {
    case 'type':
      return `Must be of the ${param} type.`;

    case 'stringMinLength':
    case 'arrayMinLength':
      return `Must have minimum length of ${param}.`;

    case 'stringMaxLength':
    case 'arrayMaxLength':
      return `Must have maximum length of ${param}.`;

    case 'instanceOf':
      return `Must be an instance of ${param.name}.`;

    case 'literal':
      return `Must be exactly equal to ${JSON.stringify(param)}.`;

    case 'never':
      return `Must not be used.`;

    case 'numberGreaterThanOrEqual':
      return `Must greater than or equal to ${param}.`;

    case 'numberGreaterThan':
      return `Must greater than ${param}.`;

    case 'numberLessThanOrEqual':
      return `Must less than or equal to ${param}.`;

    case 'numberLessThan':
      return `Must less than ${param}.`;

    case 'numberMultipleOf':
      return `Must be a multiple of ${param}.`;

    case 'oneOf':
      return `Must be equal to one of ${param.join(', ')}.`;

    case 'stringPattern':
      return `Must match the pattern ${param}.`;

    case 'tupleLength':
      return `Must have length of ${param}.`;

    case 'union':
      return 'Must conform the union requirements.';

    case 'refinement':
      return 'Must conform the refinement.';

    default:
      return `Must conform ${code}`;
  }
}
