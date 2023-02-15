import { __extends } from '../main/tslib';

describe('__extends', () => {
  test('populates class prototype', () => {
    class A {
      static aaa = 111;
    }

    class B {}

    __extends(B, A);

    expect(new B() instanceof B).toBe(true);
    expect(new B() instanceof A).toBe(true);
    expect(new A() instanceof B).toBe(false);

    expect((B as any).aaa).toBe(111);
  });
});
