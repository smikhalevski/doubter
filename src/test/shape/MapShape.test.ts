import { describe, expect, test, vi } from 'vitest';
import { MapShape, ObjectShape, Ok, Shape, StringShape } from '../../main/index.js';
import { CODE_TYPE_MAP, CODE_TYPE_STRING, MESSAGE_TYPE_MAP, MESSAGE_TYPE_STRING } from '../../main/constants.js';
import { Type } from '../../main/Type.js';
import { AsyncMockShape } from './mocks.js';

describe('MapShape', () => {
  test('creates a MapShape', () => {
    const keyShape = new Shape();
    const valueShape = new Shape();

    const shape = new MapShape(keyShape, valueShape);

    expect(shape.keyShape).toEqual(keyShape);
    expect(shape.valueShape).toEqual(valueShape);
    expect(shape.inputs).toEqual([Type.MAP]);
  });

  test('raises an issue if an input is not a Map', () => {
    const shape = new MapShape(new Shape(), new Shape());

    const result = shape.try('aaa');

    expect(result).toEqual({
      ok: false,
      issues: [{ code: CODE_TYPE_MAP, input: 'aaa', message: MESSAGE_TYPE_MAP }],
    });
  });

  test('checks keys and values', () => {
    const keyShape = new Shape().check(() => [{ code: 'xxx' }]);
    const valueShape = new Shape().check(() => [{ code: 'yyy' }]);

    const shape = new MapShape(keyShape, valueShape);

    expect(
      shape.try(
        new Map([
          ['key1', 'aaa'],
          ['key2', 'bbb'],
        ])
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

  test('raises a single issue in an early-return mode', () => {
    const keyShape = new Shape().check(() => [{ code: 'xxx' }]);
    const valueShape = new Shape().check(() => [{ code: 'yyy' }]);

    const shape = new MapShape(keyShape, valueShape);

    expect(
      shape.try(
        new Map([
          ['key1', 'aaa'],
          ['key2', 'bbb'],
        ]),
        { earlyReturn: true }
      )
    ).toEqual({
      ok: false,
      issues: [{ code: 'xxx', path: ['key1'] }],
    });
  });

  test('converts keys', () => {
    const keyShape = new Shape().convert(value => value.toUpperCase());
    const valueShape = new Shape();

    const shape = new MapShape(keyShape, valueShape);

    const input = new Map([
      ['key1', 'aaa'],
      ['key2', 'bbb'],
    ]);

    const result = shape.try(input) as Ok;

    expect(result).toEqual({
      ok: true,
      value: new Map([
        ['KEY1', 'aaa'],
        ['KEY2', 'bbb'],
      ]),
    });

    expect(result.value).not.toBe(input);
  });

  test('converts values', () => {
    const keyShape = new Shape();
    const valueShape = new Shape().convert(value => value.toUpperCase());

    const shape = new MapShape(keyShape, valueShape);

    const input = new Map([
      ['key1', 'aaa'],
      ['key2', 'bbb'],
    ]);

    const result = shape.try(input) as Ok;

    expect(result).toEqual({
      ok: true,
      value: new Map([
        ['key1', 'AAA'],
        ['key2', 'BBB'],
      ]),
    });
    expect(result.value).not.toBe(input);
  });

  test('applies operations', () => {
    const shape = new MapShape(new Shape(), new Shape()).check(() => [{ code: 'xxx' }]);

    expect(shape.try(new Map())).toEqual({
      ok: false,
      issues: [{ code: 'xxx' }],
    });
  });

  describe('coerce', () => {
    test('coerces an object', () => {
      const shape = new MapShape(new Shape(), new Shape()).coerce();

      expect(shape.parse({ key1: 'aaa', key2: 'bbb' })).toEqual(
        new Map([
          ['key1', 'aaa'],
          ['key2', 'bbb'],
        ])
      );
    });

    test('coerces an array of entities', () => {
      const shape = new MapShape(new Shape(), new Shape()).coerce();

      expect(
        shape.parse([
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
      const shape = new MapShape(new Shape(), new Shape()).coerce();

      expect(shape.try([['key1', 'aaa'], ['key2']])).toEqual({
        ok: false,
        issues: [{ code: CODE_TYPE_MAP, input: [['key1', 'aaa'], ['key2']], message: MESSAGE_TYPE_MAP }],
      });
    });

    test('does not coerce a String object', () => {
      const shape = new MapShape(new Shape(), new Shape()).coerce();
      const input = new String('aaa');

      expect(shape.try(input)).toEqual({
        ok: false,
        issues: [{ code: CODE_TYPE_MAP, input, message: MESSAGE_TYPE_MAP }],
      });
    });
  });

  describe('at', () => {
    test('returns value shape for any key', () => {
      const valueShape = new Shape();

      const shape = new MapShape(new StringShape(), valueShape);

      expect(shape.at('aaa')).toBe(valueShape);
      expect(shape.at(111)).toBe(valueShape);
      expect(shape.at(111.222)).toBe(valueShape);
      expect(shape.at(null)).toBe(valueShape);
      expect(shape.at(Symbol())).toBe(valueShape);
    });
  });

  describe('deepPartial', () => {
    test('does not mark keys as optional', () => {
      const shape = new MapShape(new StringShape(), new StringShape()).deepPartial();

      expect(shape.try(new Map([[undefined, 'bbb']]))).toEqual({
        ok: false,
        issues: [{ code: CODE_TYPE_STRING, path: [undefined], message: MESSAGE_TYPE_STRING }],
      });

      expect(shape.parse(new Map([['aaa', 'bbb']]))).toEqual(new Map([['aaa', 'bbb']]));
    });

    test('marks values as optional', () => {
      const shape = new MapShape(new StringShape(), new StringShape()).deepPartial();

      expect(shape.parse(new Map([['aaa', undefined]]))).toEqual(new Map([['aaa', undefined]]));
    });

    test('makes keys deep partial', () => {
      const shape = new MapShape(new ObjectShape({ key1: new StringShape() }, null), new StringShape()).deepPartial();

      expect(shape.parse(new Map([[{}, 'aaa']]))).toEqual(new Map([[{}, 'aaa']]));
      expect(shape.parse(new Map([[{ key1: undefined }, 'aaa']]))).toEqual(new Map([[{ key1: undefined }, 'aaa']]));

      expect(shape.try(new Map([[{ key1: 111 }, 'aaa']]))).toEqual({
        ok: false,
        issues: [
          {
            code: CODE_TYPE_STRING,
            input: 111,
            message: MESSAGE_TYPE_STRING,
            path: [{ key1: 111 }, 'key1'],
          },
        ],
      });
    });

    test('makes values deep partial', () => {
      const shape = new MapShape(new StringShape(), new ObjectShape({ key1: new StringShape() }, null)).deepPartial();

      expect(shape.parse(new Map([['aaa', {}]]))).toEqual(new Map([['aaa', {}]]));
      expect(shape.parse(new Map([['aaa', { key1: undefined }]]))).toEqual(new Map([['aaa', { key1: undefined }]]));

      expect(shape.try(new Map([['aaa', { key1: 111 }]]))).toEqual({
        ok: false,
        issues: [
          {
            code: CODE_TYPE_STRING,
            input: 111,
            message: MESSAGE_TYPE_STRING,
            path: ['aaa', 'key1'],
          },
        ],
      });
    });
  });

  describe('async', () => {
    test('raises an issue if an input is not a Map', async () => {
      const shape = new MapShape(new AsyncMockShape(), new AsyncMockShape());

      await expect(shape.tryAsync('aaa')).resolves.toEqual({
        ok: false,
        issues: [{ code: CODE_TYPE_MAP, input: 'aaa', message: MESSAGE_TYPE_MAP }],
      });
    });

    test('checks keys and values', async () => {
      const keyShape = new AsyncMockShape().check(() => [{ code: 'xxx' }]);
      const valueShape = new AsyncMockShape().check(() => [{ code: 'yyy' }]);

      const shape = new MapShape(keyShape, valueShape);

      await expect(
        shape.tryAsync(
          new Map([
            ['key1', 'aaa'],
            ['key2', 'bbb'],
          ])
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

    test('does not invoke the value shape if the previous key shape has raised an issue in an early-return mode', async () => {
      const keyShape = new AsyncMockShape().check(() => [{ code: 'xxx' }]);
      const valueShape = new AsyncMockShape();

      await new MapShape(keyShape, valueShape).tryAsync(
        new Map([
          ['key1', 'aaa'],
          ['key2', 'bbb'],
        ]),
        { earlyReturn: true }
      );

      expect(keyShape._applyAsync).toHaveBeenCalledTimes(1);
      expect(valueShape._applyAsync).not.toHaveBeenCalled();
    });

    test('does not invoke the key shape if the previous value shape has raised an issue in an early-return mode', async () => {
      const keyShape = new AsyncMockShape();
      const valueShape = new AsyncMockShape().check(() => [{ code: 'xxx' }]);

      await new MapShape(keyShape, valueShape).tryAsync(
        new Map([
          ['key1', 'aaa'],
          ['key2', 'bbb'],
        ]),
        { earlyReturn: true }
      );

      expect(keyShape._applyAsync).toHaveBeenCalledTimes(1);
      expect(valueShape._applyAsync).toHaveBeenCalledTimes(1);
    });

    test('raises multiple issues', async () => {
      const keyShape = new AsyncMockShape().check(() => [{ code: 'xxx' }]);
      const valueShape = new AsyncMockShape().check(() => [{ code: 'yyy' }]);

      const shape = new MapShape(keyShape, valueShape);

      await expect(
        shape.tryAsync(
          new Map([
            ['key1', 'aaa'],
            ['key2', 'bbb'],
          ])
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

    test('converts keys', async () => {
      const keyShape = new Shape<string>()
        .convertAsync(value => Promise.resolve(value))
        .convert(value => value.toUpperCase());

      const valueShape = new Shape();

      const shape = new MapShape(keyShape, valueShape);

      const input = new Map([
        ['key1', 'aaa'],
        ['key2', 'bbb'],
      ]);

      const result = shape.tryAsync(input) as Promise<Ok>;

      await expect(result).resolves.toEqual({
        ok: true,
        value: new Map([
          ['KEY1', 'aaa'],
          ['KEY2', 'bbb'],
        ]),
      });

      expect((await result).value).not.toBe(input);
    });

    test('converts values', async () => {
      const valueShape = new Shape<string>()
        .convertAsync(value => Promise.resolve(value))
        .convert(value => value.toUpperCase());

      const shape = new MapShape(new AsyncMockShape(), valueShape);

      const input = new Map([
        ['key1', 'aaa'],
        ['key2', 'bbb'],
      ]);

      const result = shape.tryAsync(input) as Promise<Ok>;

      await expect(result).resolves.toEqual({
        ok: true,
        value: new Map([
          ['key1', 'AAA'],
          ['key2', 'BBB'],
        ]),
      });
      expect((await result).value).not.toBe(input);
    });

    test('applies operations', async () => {
      const shape = new MapShape(new AsyncMockShape(), new AsyncMockShape()).check(() => [{ code: 'xxx' }]);

      await expect(shape.tryAsync(new Map())).resolves.toEqual({
        ok: false,
        issues: [{ code: 'xxx' }],
      });
    });

    test('does not swallow errors thrown by value shape', async () => {
      const shape = new MapShape(
        new AsyncMockShape(),
        new AsyncMockShape().check(() => {
          throw new Error('expected');
        })
      );

      await expect(shape.tryAsync(new Map([['aaa', 111]]))).rejects.toEqual(new Error('expected'));
    });

    test('does not swallow errors thrown by key shape', async () => {
      const keyCheck = vi
        .fn()
        .mockImplementationOnce(value => value)
        .mockImplementationOnce(() => {
          throw new Error('expected');
        });

      const shape = new MapShape(new AsyncMockShape().check(keyCheck), new AsyncMockShape());

      await expect(
        shape.tryAsync(
          new Map([
            ['aaa', 111],
            ['bbb', 222],
          ])
        )
      ).rejects.toEqual(new Error('expected'));
    });

    describe('coerce', () => {
      test('coerces an object', async () => {
        const shape = new MapShape(new AsyncMockShape(), new AsyncMockShape()).coerce();

        await expect(shape.parseAsync({ key1: 'aaa', key2: 'bbb' })).resolves.toEqual(
          new Map([
            ['key1', 'aaa'],
            ['key2', 'bbb'],
          ])
        );
      });

      test('coerces an array of entities', async () => {
        const shape = new MapShape(new AsyncMockShape(), new AsyncMockShape()).coerce();

        await expect(
          shape.parseAsync([
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
        const shape = new MapShape(new AsyncMockShape(), new AsyncMockShape()).coerce();

        await expect(shape.tryAsync([['key1', 'aaa'], ['key2']])).resolves.toEqual({
          ok: false,
          issues: [
            {
              code: CODE_TYPE_MAP,
              input: [['key1', 'aaa'], ['key2']],
              message: MESSAGE_TYPE_MAP,
            },
          ],
        });
      });
    });
  });
});
