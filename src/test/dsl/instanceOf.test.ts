import { instanceOf } from '../../main';

describe('instanceOf', () => {
  class Foo {}

  test('raises if value is not an instance of the class', () => {
    expect(instanceOf(Foo).validate('aaa')).toEqual([
      {
        code: 'instanceOf',
        path: [],
        input: 'aaa',
        param: Foo,
      },
    ]);
  });

  test('allows an instance of the class', () => {
    expect(instanceOf(Foo).validate(new Foo())).toEqual([]);
  });
});
