import { describe, measure, test } from 'toofast';
import * as valita from '@badrap/valita';
import { Ajv } from 'ajv';
import * as myzod from 'myzod';
import * as zod from 'zod';
import * as doubter from '../../../lib/index.mjs';

describe('string()', () => {
  describe('"aaa"', () => {
    const value = 'aaa';

    test('Ajv', () => {
      const validate = new Ajv().compile({
        $schema: 'http://json-schema.org/draft-07/schema#',
        type: 'string',
      });

      measure(() => {
        validate(value);
      });
    });

    test('zod', () => {
      const type = zod.string();

      measure(() => {
        type.parse(value);
      });
    });

    test('myzod', () => {
      const type = myzod.string();

      measure(() => {
        type.parse(value);
      });
    });

    test('valita', () => {
      const type = valita.string();

      measure(() => {
        type.parse(value);
      });
    });

    test('doubter', () => {
      const shape = doubter.string();

      measure(() => {
        shape.parse(value);
      });
    });
  });

  describe('111', () => {
    const value = 111;

    test('Ajv', () => {
      const validate = new Ajv().compile({
        $schema: 'http://json-schema.org/draft-07/schema#',
        type: 'string',
      });

      measure(() => {
        validate(value);
      });
    });

    test('zod', () => {
      const type = zod.string();

      measure(() => {
        type.safeParse(value);
      });
    });

    test('myzod', () => {
      const type = myzod.string();

      measure(() => {
        type.try(value);
      });
    });

    test('valita', () => {
      const type = valita.string();

      measure(() => {
        type.try(value).issues;
      });
    });

    test('doubter', () => {
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

    test('Ajv', () => {
      const validate = new Ajv().compile({
        $schema: 'http://json-schema.org/draft-07/schema#',
        type: 'string',
        minLength: 3,
      });

      measure(() => {
        validate(value);
      });
    });

    test('zod', () => {
      const type = zod.string().min(3);

      measure(() => {
        type.parse(value);
      });
    });

    test('myzod', () => {
      const type = myzod.string().min(3);

      measure(() => {
        type.parse(value);
      });
    });

    test('valita', () => {
      const type = valita.string().assert(v => v.length >= 3);

      measure(() => {
        type.parse(value);
      });
    });

    test('doubter', () => {
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

    test('Ajv', () => {
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

    test('zod', () => {
      const type = zod.string().min(3).max(3);

      measure(() => {
        type.parse(value);
      });
    });

    test('myzod', () => {
      const type = myzod.string().min(3).max(3);

      measure(() => {
        type.parse(value);
      });
    });

    test('valita', () => {
      const type = valita
        .string()
        .assert(v => v.length >= 3)
        .assert(v => v.length <= 3);

      measure(() => {
        type.parse(value);
      });
    });

    test('doubter', () => {
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
    test('zod', () => {
      const type = zod.coerce.string();

      measure(() => {
        type.parse(value);
      });
    });

    test('doubter', () => {
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

  test('zod', () => {
    const type = zod.string().optional();

    measure(() => {
      type.parse(value);
    });
  });

  test('myzod', () => {
    const type = myzod.string().optional();

    measure(() => {
      type.parse(value);
    });
  });

  test('valita', () => {
    const type = valita.string().optional().type;

    measure(() => {
      type.parse(value);
    });
  });

  test('doubter', () => {
    const shape = doubter.string().optional();

    measure(() => {
      shape.parse(value);
    });
  });
});

describe('string().to(string())', () => {
  const value = 'aaa';

  test('zod', () => {
    const type = zod.string().pipe(zod.string());

    measure(() => {
      type.parse(value);
    });
  });

  test('doubter', () => {
    const shape = doubter.string().to(doubter.string());

    measure(() => {
      shape.parse(value);
    });
  });
});

describe('string().convert(() => 111)', () => {
  const value = 'aaa';

  test('zod', () => {
    const type = zod.string().transform(() => 111);

    measure(() => {
      type.parse(value);
    });
  });

  test('myzod', () => {
    const type = myzod.string().map(() => 111);

    measure(() => {
      type.parse(value);
    });
  });

  test('valita', () => {
    const type = valita.string().map(() => 111);

    measure(() => {
      type.parse(value);
    });
  });

  test('doubter', () => {
    const shape = doubter.string().convert(() => 111);

    measure(() => {
      shape.parse(value);
    });
  });
});

describe('string().catch("foo")', () => {
  const createTests = value => {
    test('zod', () => {
      const type = zod.string().catch('foo');

      measure(() => {
        type.parse(value);
      });
    });

    test('doubter', () => {
      const shape = doubter.string().catch('foo');

      measure(() => {
        shape.parse(value);
      });
    });
  };

  describe('"aaa"', () => createTests('aaa'));

  describe('111', () => createTests(111));
});
