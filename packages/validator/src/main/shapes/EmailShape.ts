import { ApplyResult, Message, ParseOptions, TypeConstraintOptions } from 'doubter';
import { ValidatorShape } from './ValidatorShape';
import isEmail, { IsEmailOptions } from 'validator/es/lib/isEmail';

export class EmailShape extends ValidatorShape<IsEmailOptions> {
  constructor(options?: TypeConstraintOptions | Message) {
    super({});
  }

  apply(input: unknown, options: ParseOptions): ApplyResult<string> {
    const { _applyChecks } = this;

    if (typeof input !== 'string' || !isEmail(input, this._options)) {
      // return [this._typeIssueFactory(input)];
    }
    if (_applyChecks !== null) {
      return _applyChecks(input, null, options);
    }
    return null;
  }

  allowDisplayName(value = true) {
    return this._clone({ allow_display_name: value });
  }

  requireDisplayName(value = true) {
    return this._clone({ require_display_name: value });
  }

  allowUtf8LocalPart(value = true) {
    return this._clone({ allow_utf8_local_part: value });
  }

  requireTld(value = true) {
    return this._clone({ require_tld: value });
  }

  ignoreMaxLength(value = true) {
    return this._clone({ ignore_max_length: value });
  }

  allowIpDomain(value = true) {
    return this._clone({ allow_ip_domain: value });
  }

  domainSpecificValidation(value = true) {
    return this._clone({ domain_specific_validation: value });
  }

  hostBlacklist(hosts: string[]) {
    return this._clone({ host_blacklist: hosts });
  }

  blacklistedChars(chars: string) {
    return this._clone({ blacklisted_chars: chars });
  }
}
