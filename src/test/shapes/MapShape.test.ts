import { MapShape, Shape, StringShape } from '../../main';
import { CODE_TYPE, MESSAGE_MAP_TYPE, TYPE_MAP, TYPE_OBJECT } from '../../main/constants';

describe('MapShape', () => {
  test('creates a Map shape', () => {
    const keyShape = new Shape();
    const valueShape = new Shape();

    const setShape = new MapShape(keyShape, valueShape);

    expect(setShape.keyShape).toEqual(keyShape);
    expect(setShape.valueShape).toEqual(valueShape);
    expect(setShape['_getInputTypes']()).toEqual([TYPE_OBJECT]);
  });

  test('raises an issue if an input is not a Map', () => {
    const setShape = new MapShape(new Shape(), new Shape());

    const result = setShape.try('aaa');

    expect(result).toEqual({
      ok: false,
      issues: [{ code: CODE_TYPE, input: 'aaa', message: MESSAGE_MAP_TYPE, param: TYPE_MAP, path: [] }],
    });
  });

  test('checks keys and values', () => {
    const keyShape = new Shape().check(() => [{ code: 'xxx' }]);
    const valueShape = new Shape().check(() => [{ code: 'yyy' }]);

    const mapShape = new MapShape(keyShape, valueShape);

    expect(
      mapShape.try(
        new Map([
          ['key1', 'aaa'],
          ['key2', 'bbb'],
        ])
      )
    ).toEqual({
      ok: false,
      issues: [{ code: 'xxx', path: ['key1'] }],
    });
  });

  test('raises multiple issues in verbose mode', () => {
    const keyShape = new Shape().check(() => [{ code: 'xxx' }]);
    const valueShape = new Shape().check(() => [{ code: 'yyy' }]);

    const mapShape = new MapShape(keyShape, valueShape);

    expect(
      mapShape.try(
        new Map([
          ['key1', 'aaa'],
          ['key2', 'bbb'],
        ]),
        { verbose: true }
      )
    ).toEqual({
      ok: false,
      issues: [
        { code: 'xxx', path: ['key1'] },
        { code: 'yyy', path: ['key1'] },
        { code: 'xxx', path: ['key2'] },
        { code: 'yyy', path: ['key2'] },
      ],
    });
  });

  test('transforms keys', () => {
    const keyShape = new Shape().transform(value => value.toUpperCase());
    const valueShape = new Shape();

    const mapShape = new MapShape(keyShape, valueShape);

    const map = new Map([
      ['key1', 'aaa'],
      ['key2', 'bbb'],
    ]);

    const result: any = mapShape.try(map);

    expect(result).toEqual({
      ok: true,
      value: new Map([
        ['KEY1', 'aaa'],
        ['KEY2', 'bbb'],
      ]),
    });

    expect(result.value).not.toBe(map);
  });

  test('transforms values', () => {
    const keyShape = new Shape();
    const valueShape = new Shape().transform(value => value.toUpperCase());

    const mapShape = new MapShape(keyShape, valueShape);

    const map = new Map([
      ['key1', 'aaa'],
      ['key2', 'bbb'],
    ]);

    const result: any = mapShape.try(map);

    expect(result).toEqual({
      ok: true,
      value: new Map([
        ['key1', 'AAA'],
        ['key2', 'BBB'],
      ]),
    });
    expect(result.value).not.toBe(map);
  });

  test('applies checks', () => {
    const mapShape = new MapShape(new Shape(), new Shape()).check(() => [{ code: 'xxx' }]);

    expect(mapShape.try(new Map())).toEqual({
      ok: false,
      issues: [{ code: 'xxx', path: [] }],
    });
  });

  test('returns value shape for any key', () => {
    const valueShape = new Shape();
    const objShape = new MapShape(new StringShape(), valueShape);

    expect(objShape.at('aaa')).toBe(valueShape);
    expect(objShape.at(111)).toBe(valueShape);
    expect(objShape.at(111.222)).toBe(valueShape);
    expect(objShape.at(null)).toBe(valueShape);
    expect(objShape.at(Symbol())).toBe(valueShape);
  });

  test('coerces an object', () => {
    const mapShape = new MapShape(new Shape(), new Shape()).coerce();

    expect(mapShape.parse({ key1: 'aaa', key2: 'bbb' })).toEqual(
      new Map([
        ['key1', 'aaa'],
        ['key2', 'bbb'],
      ])
    );
  });

  test('coerces an array of entities', () => {
    const mapShape = new MapShape(new Shape(), new Shape()).coerce();

    expect(
      mapShape.parse([
        ['key1', 'aaa'],
        ['key2', 'bbb'],
      ])
    ).toEqual(
      new Map([
        ['key1', 'aaa'],
        ['key2', 'bbb'],
      ])
    );
  });

  test('does not coerce an array with non-entry-like arrays', () => {
    const mapShape = new MapShape(new Shape(), new Shape()).coerce();

    expect(mapShape.try([['key1', 'aaa'], ['key2']])).toEqual({
      ok: false,
      issues: [
        {
          code: CODE_TYPE,
          path: [],
          input: [['key1', 'aaa'], ['key2']],
          message: MESSAGE_MAP_TYPE,
          param: TYPE_MAP,
        },
      ],
    });
  });

  describe('async', () => {
    test('raises an issue if an input is not a Map', async () => {
      const setShape = new MapShape(
        new Shape().transformAsync(value => Promise.resolve(value)),
        new Shape().transformAsync(value => Promise.resolve(value))
      );

      await expect(setShape.tryAsync('aaa')).resolves.toEqual({
        ok: false,
        issues: [{ code: CODE_TYPE, input: 'aaa', message: MESSAGE_MAP_TYPE, param: TYPE_MAP, path: [] }],
      });
    });

    test('checks keys and values', async () => {
      const keyShape = new Shape().transformAsync(value => Promise.resolve(value)).check(() => [{ code: 'xxx' }]);
      const valueShape = new Shape().transformAsync(value => Promise.resolve(value)).check(() => [{ code: 'yyy' }]);

      const mapShape = new MapShape(keyShape, valueShape);

      await expect(
        mapShape.tryAsync(
          new Map([
            ['key1', 'aaa'],
            ['key2', 'bbb'],
          ])
        )
      ).resolves.toEqual({
        ok: false,
        issues: [{ code: 'xxx', path: ['key1'] }],
      });
    });

    test('raises multiple issues in verbose mode', async () => {
      const keyShape = new Shape().transformAsync(value => Promise.resolve(value)).check(() => [{ code: 'xxx' }]);
      const valueShape = new Shape().transformAsync(value => Promise.resolve(value)).check(() => [{ code: 'yyy' }]);

      const mapShape = new MapShape(keyShape, valueShape);

      await expect(
        mapShape.tryAsync(
          new Map([
            ['key1', 'aaa'],
            ['key2', 'bbb'],
          ]),
          { verbose: true }
        )
      ).resolves.toEqual({
        ok: false,
        issues: [
          { code: 'xxx', path: ['key1'] },
          { code: 'yyy', path: ['key1'] },
          { code: 'xxx', path: ['key2'] },
          { code: 'yyy', path: ['key2'] },
        ],
      });
    });

    test('transforms keys', async () => {
      const keyShape = new Shape<string>()
        .transformAsync(value => Promise.resolve(value))
        .transform(value => value.toUpperCase());

      const valueShape = new Shape();

      const mapShape = new MapShape(keyShape, valueShape);

      const map = new Map([
        ['key1', 'aaa'],
        ['key2', 'bbb'],
      ]);

      const result: any = mapShape.tryAsync(map);

      await expect(result).resolves.toEqual({
        ok: true,
        value: new Map([
          ['KEY1', 'aaa'],
          ['KEY2', 'bbb'],
        ]),
      });

      expect((await result).value).not.toBe(map);
    });

    test('transforms values', async () => {
      const keyShape = new Shape().transformAsync(value => Promise.resolve(value));
      const valueShape = new Shape<string>()
        .transformAsync(value => Promise.resolve(value))
        .transform(value => value.toUpperCase());

      const mapShape = new MapShape(keyShape, valueShape);

      const map = new Map([
        ['key1', 'aaa'],
        ['key2', 'bbb'],
      ]);

      const result: any = mapShape.tryAsync(map);

      await expect(result).resolves.toEqual({
        ok: true,
        value: new Map([
          ['key1', 'AAA'],
          ['key2', 'BBB'],
        ]),
      });
      expect((await result).value).not.toBe(map);
    });

    test('applies checks', async () => {
      const mapShape = new MapShape(
        new Shape().transformAsync(value => Promise.resolve(value)),
        new Shape().transformAsync(value => Promise.resolve(value))
      ).check(() => [{ code: 'xxx' }]);

      await expect(mapShape.tryAsync(new Map())).resolves.toEqual({
        ok: false,
        issues: [{ code: 'xxx', path: [] }],
      });
    });

    test('coerces an object', async () => {
      const mapShape = new MapShape(
        new Shape().transformAsync(value => Promise.resolve(value)),
        new Shape().transformAsync(value => Promise.resolve(value))
      ).coerce();

      await expect(mapShape.parseAsync({ key1: 'aaa', key2: 'bbb' })).resolves.toEqual(
        new Map([
          ['key1', 'aaa'],
          ['key2', 'bbb'],
        ])
      );
    });

    test('coerces an array of entities', async () => {
      const mapShape = new MapShape(
        new Shape().transformAsync(value => Promise.resolve(value)),
        new Shape().transformAsync(value => Promise.resolve(value))
      ).coerce();

      await expect(
        mapShape.parseAsync([
          ['key1', 'aaa'],
          ['key2', 'bbb'],
        ])
      ).resolves.toEqual(
        new Map([
          ['key1', 'aaa'],
          ['key2', 'bbb'],
        ])
      );
    });

    test('does not coerce an array with non-entry-like arrays', async () => {
      const mapShape = new MapShape(
        new Shape().transformAsync(value => Promise.resolve(value)),
        new Shape().transformAsync(value => Promise.resolve(value))
      ).coerce();

      await expect(mapShape.tryAsync([['key1', 'aaa'], ['key2']])).resolves.toEqual({
        ok: false,
        issues: [
          {
            code: CODE_TYPE,
            path: [],
            input: [['key1', 'aaa'], ['key2']],
            message: MESSAGE_MAP_TYPE,
            param: TYPE_MAP,
          },
        ],
      });
    });
  });
});
