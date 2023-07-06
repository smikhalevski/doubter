const Ajv = require('ajv');
const zod = require('zod');
const myzod = require('myzod');
const valita = require('@badrap/valita');
const doubter = require('../../../lib');

describe('string()', () => {
  describe('"aaa"', () => {
    const value = 'aaa';

    test('Ajv', measure => {
      const validate = new Ajv().compile({
        $schema: 'http://json-schema.org/draft-07/schema#',
        type: 'string',
      });

      measure(() => {
        validate(value);
      });
    });

    test('zod', measure => {
      const type = zod.string();

      measure(() => {
        type.parse(value);
      });
    });

    test('myzod', measure => {
      const type = myzod.string();

      measure(() => {
        type.parse(value);
      });
    });

    test('valita', measure => {
      const type = valita.string();

      measure(() => {
        type.parse(value);
      });
    });

    test('doubter', measure => {
      const shape = doubter.string();

      measure(() => {
        shape.parse(value);
      });
    });
  });

  describe('111', () => {
    const value = 111;

    test('Ajv', measure => {
      const validate = new Ajv().compile({
        $schema: 'http://json-schema.org/draft-07/schema#',
        type: 'string',
      });

      measure(() => {
        validate(value);
      });
    });

    test('zod', measure => {
      const type = zod.string();

      measure(() => {
        type.safeParse(value);
      });
    });

    test('myzod', measure => {
      const type = myzod.string();

      measure(() => {
        type.try(value);
      });
    });

    test('valita', measure => {
      const type = valita.string();

      measure(() => {
        type.try(value).issues;
      });
    });

    test('doubter', measure => {
      const shape = doubter.string();

      measure(() => {
        shape.try(value);
      });
    });
  });
});

describe('string().min(3)', () => {
  const createTests = () => {
    const value = 'aaa';

    test('Ajv', measure => {
      const validate = new Ajv().compile({
        $schema: 'http://json-schema.org/draft-07/schema#',
        type: 'string',
        minLength: 3,
      });

      measure(() => {
        validate(value);
      });
    });

    test('zod', measure => {
      const type = zod.string().min(3);

      measure(() => {
        type.parse(value);
      });
    });

    test('myzod', measure => {
      const type = myzod.string().min(3);

      measure(() => {
        type.parse(value);
      });
    });

    test('valita', measure => {
      const type = valita.string().assert(v => v.length >= 3);

      measure(() => {
        type.parse(value);
      });
    });

    test('doubter', measure => {
      const shape = doubter.string().min(3);

      measure(() => {
        shape.parse(value);
      });
    });
  };

  describe('"aaa"', () => createTests('aaa'));

  describe('"aaaa"', () => createTests('aaaa'));
});

describe('string().min(3).max(3)', () => {
  const createTests = () => {
    const value = 'aaa';

    test('Ajv', measure => {
      const validate = new Ajv().compile({
        $schema: 'http://json-schema.org/draft-07/schema#',
        type: 'string',
        minLength: 3,
        maxLength: 3,
      });

      measure(() => {
        validate(value);
      });
    });

    test('zod', measure => {
      const type = zod.string().min(3).max(3);

      measure(() => {
        type.parse(value);
      });
    });

    test('myzod', measure => {
      const type = myzod.string().min(3).max(3);

      measure(() => {
        type.parse(value);
      });
    });

    test('valita', measure => {
      const type = valita
        .string()
        .assert(v => v.length >= 3)
        .assert(v => v.length <= 3);

      measure(() => {
        type.parse(value);
      });
    });

    test('doubter', measure => {
      const shape = doubter.string().min(3).max(3);

      measure(() => {
        shape.parse(value);
      });
    });
  };

  describe('"aaa"', () => createTests('aaa'));

  describe('"aaaa"', () => createTests('aaaa'));
});

describe('string().coerce()', () => {
  const createTests = value => {
    test('zod', measure => {
      const type = zod.coerce.string();

      measure(() => {
        type.parse(value);
      });
    });

    test('doubter', measure => {
      const shape = doubter.string().coerce();

      measure(() => {
        shape.parse(value);
      });
    });
  };

  describe('"aaa"', () => createTests('aaa'));

  describe('111', () => createTests(111));

  describe('new String("aaa")', () => createTests(String('aaa')));
});

describe('string().optional()', () => {
  const value = 'aaa';

  test('zod', measure => {
    const type = zod.string().optional();

    measure(() => {
      type.parse(value);
    });
  });

  test('myzod', measure => {
    const type = myzod.string().optional();

    measure(() => {
      type.parse(value);
    });
  });

  test('valita', measure => {
    const type = valita.string().optional();

    measure(() => {
      type.parse(value);
    });
  });

  test('doubter', measure => {
    const shape = doubter.string().optional();

    measure(() => {
      shape.parse(value);
    });
  });
});

describe('string().to(string())', () => {
  const value = 'aaa';

  test('zod', measure => {
    const type = zod.string().pipe(zod.string());

    measure(() => {
      type.parse(value);
    });
  });

  test('doubter', measure => {
    const shape = doubter.string().to(doubter.string());

    measure(() => {
      shape.parse(value);
    });
  });
});

describe('string().convert(() => 111)', () => {
  const value = 'aaa';

  test('zod', measure => {
    const type = zod.string().transform(() => 111);

    measure(() => {
      type.parse(value);
    });
  });

  test('myzod', measure => {
    const type = myzod.string().map(() => 111);

    measure(() => {
      type.parse(value);
    });
  });

  test('valita', measure => {
    const type = valita.string().map(() => 111);

    measure(() => {
      type.parse(value);
    });
  });

  test('doubter', measure => {
    const shape = doubter.string().convert(() => 111);

    measure(() => {
      shape.parse(value);
    });
  });
});

describe('string().catch("foo")', () => {
  const createTests = value => {
    test('zod', measure => {
      const type = zod.string().catch('foo');

      measure(() => {
        type.parse(value);
      });
    });

    test('doubter', measure => {
      const shape = doubter.string().catch('foo');

      measure(() => {
        shape.parse(value);
      });
    });
  };

  describe('"aaa"', () => createTests('aaa'));

  describe('111', () => createTests(111));
});
