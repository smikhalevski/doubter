import { ObjectShape } from '../../main';
import { CODE_OBJECT_PLAIN, MESSAGE_OBJECT_PLAIN } from '../../main/constants';

describe('plain', () => {
  test('raises if object is not plain', () => {
    const shape = new ObjectShape({}, null).plain();

    expect(shape.parse({})).toEqual({});

    expect(shape.try(new (class {})())).toEqual({
      ok: false,
      issues: [{ code: CODE_OBJECT_PLAIN, input: {}, message: MESSAGE_OBJECT_PLAIN, param: undefined }],
    });
  });
});
