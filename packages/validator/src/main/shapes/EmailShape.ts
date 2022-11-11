import { createIssueFactory, Message, TypeConstraintOptions } from 'doubter';
import { ValidatorShape } from './ValidatorShape';
import isEmail, { IsEmailOptions } from 'validator/es/lib/isEmail';
import { CODE_TYPE, MESSAGE_EMAIL, TYPE_EMAIL } from '../constants';

export class EmailShape extends ValidatorShape<IsEmailOptions> {
  protected _typeIssueFactory;

  constructor(options?: TypeConstraintOptions | Message) {
    super(isEmail);

    this._typeIssueFactory = createIssueFactory(CODE_TYPE, MESSAGE_EMAIL, options, TYPE_EMAIL);
  }

  /**
   * If `true`, the validator will also match `Display Name <email-address>`.
   *
   * @default false
   */
  allowDisplayName(value = true): this {
    return this._clone({ allow_display_name: value });
  }

  /**
   * If `true`, the validator will reject strings without the format `Display Name <email-address>`.
   *
   * @default false
   */
  requireDisplayName(value = true): this {
    return this._clone({ require_display_name: value });
  }

  /**
   * If `false`, the validator will not allow any non-English UTF8 character in email address' local part.
   *
   * @default true
   */
  allowUtf8LocalPart(value = true): this {
    return this._clone({ allow_utf8_local_part: value });
  }

  /**
   * If `false`, e-mail addresses without having TLD in their domain will also be matched.
   *
   * @default true
   */
  requireTld(value = true): this {
    return this._clone({ require_tld: value });
  }

  /**
   * If `true`, the validator will not check for the standard max length of an email.
   *
   * @default false
   */
  ignoreMaxLength(value = true): this {
    return this._clone({ ignore_max_length: value });
  }

  /**
   * If `true`, the validator will allow IP addresses in the host part.
   *
   * @default false
   */
  allowIpDomain(value = true): this {
    return this._clone({ allow_ip_domain: value });
  }

  /**
   * If `true`, some additional validation will be enabled, e.g. disallowing certain syntactically valid email addresses
   * that are rejected by GMail.
   *
   * @default false
   */
  domainSpecificValidation(value = true): this {
    return this._clone({ domain_specific_validation: value });
  }

  /**
   * If the part of the email after the @ symbol matches one of the blacklisted hosts, the validation fails.
   */
  hostBlacklist(hosts: string[]): this {
    return this._clone({ host_blacklist: hosts });
  }

  /**
   * The validator will reject emails that include any of the characters in the string, in the name part.
   */
  blacklistedChars(chars: string): this {
    return this._clone({ blacklisted_chars: chars });
  }
}
