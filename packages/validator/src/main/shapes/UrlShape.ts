import { ApplyResult, Message, ParseOptions, TypeConstraintOptions } from 'doubter';
import isURL, { IsURLOptions } from 'validator/es/lib/isURL';
import { ValidatorShape } from './ValidatorShape';

export class UrlShape extends ValidatorShape<IsURLOptions> {
  constructor(options?: TypeConstraintOptions | Message) {
    super({});
  }

  apply(input: unknown, options: ParseOptions): ApplyResult<string> {
    const { _applyChecks } = this;

    if (typeof input !== 'string' || !isURL(input, this._options)) {
      // return [this._typeIssueFactory(input)];
    }
    if (_applyChecks !== null) {
      return _applyChecks(input, null, options);
    }
    return null;
  }

  protocols(protocols: string[]): this {
    return this._clone({ protocols });
  }

  requireTld(value = true): this {
    return this._clone({ require_tld: value });
  }

  requireProtocol(value = true): this {
    return this._clone({ require_protocol: value });
  }

  requireHost(value = true): this {
    return this._clone({ require_host: value });
  }

  requirePort(value = true): this {
    return this._clone({ require_port: value });
  }

  requireValidProtocol(value = true): this {
    return this._clone({ require_valid_protocol: value });
  }

  allowUnderscores(value = true): this {
    return this._clone({ allow_underscores: value });
  }

  hostWhitelist(hosts: Array<string | RegExp>): this {
    return this._clone({ host_whitelist: hosts });
  }

  hostBlacklist(hosts: Array<string | RegExp>): this {
    return this._clone({ host_blacklist: hosts });
  }

  allowTrailingDot(value = true): this {
    return this._clone({ allow_trailing_dot: value });
  }

  allowProtocolRelativeUrls(value = true): this {
    return this._clone({ allow_protocol_relative_urls: value });
  }

  disallowAuth(value = true): this {
    return this._clone({ disallow_auth: value });
  }

  allowFragments(value = true): this {
    return this._clone({ allow_fragments: value });
  }

  allowQueryComponents(value = true): this {
    return this._clone({ allow_query_components: value });
  }
}
