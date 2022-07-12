const a = true;

test('accessor', measure => {
  const foo = {};

  Object.defineProperty(foo, 'aaa', {
    get() {
      return a;
    },
  });

  measure(() => {
    foo.aaa;
  });
});

test('method', measure => {
  const foo = {
    aaa() {
      return a;
    },
  };

  measure(() => {
    foo.aaa();
  });
});
