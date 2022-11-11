import { createIssueFactory, Message, TypeConstraintOptions } from 'doubter';
import { ValidatorShape } from './ValidatorShape';
import { CODE_TYPE, MESSAGE_UUID, TYPE_UUID } from '../constants';
import isUUID, { UUIDVersion } from 'validator/es/lib/isUUID';

export class UuidShape extends ValidatorShape<UUIDVersion> {
  protected _typeIssueFactory;

  constructor(options?: TypeConstraintOptions | Message) {
    super(isUUID);

    this._typeIssueFactory = createIssueFactory(CODE_TYPE, MESSAGE_UUID, options, TYPE_UUID);
  }

  version(version: UUIDVersion): this {
    return this._clone(version);
  }
}
