import { createIssueFactory, Message, TypeConstraintOptions } from 'doubter';
import isURL, { IsURLOptions } from 'validator/es/lib/isURL';
import { ValidatorShape } from './ValidatorShape';
import { CODE_TYPE, MESSAGE_URL, TYPE_URL } from '../constants';

export class UrlShape extends ValidatorShape<IsURLOptions> {
  protected _typeIssueFactory;

  constructor(options?: TypeConstraintOptions | Message) {
    super(isURL);

    this._typeIssueFactory = createIssueFactory(CODE_TYPE, MESSAGE_URL, options, TYPE_URL);
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
