const Ajv = require('ajv');
const myzod = require('myzod');
const lib = require('../../lib/index-cjs');

const testData = {
  number: 1,
  negNumber: -1,
  maxNumber: Number.MAX_VALUE,
  string: 'string',
  longString:
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. Vivendum intellegat et qui, ei denique consequuntur vix. Semper aeterno percipit ut his, sea ex utinam referrentur repudiandae. No epicuri hendrerit consetetur sit, sit dicta adipiscing ex, in facete detracto deterruisset duo. Quot populo ad qui. Sit fugit nostrum et. Ad per diam dicant interesset, lorem iusto sensibus ut sed. No dicam aperiam vis. Pri posse graeco definitiones cu, id eam populo quaestio adipiscing, usu quod malorum te. Ex nam agam veri, dicunt efficiantur ad qui, ad legere adversarium sit. Commune platonem mel id, brute adipiscing duo an. Vivendum intellegat et qui, ei denique consequuntur vix. Offendit eleifend moderatius ex vix, quem odio mazim et qui, purto expetendis cotidieque quo cu, veri persius vituperata ei nec. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.',
  boolean: true,
  deeplyNested: {
    foo: 'bar',
    num: 1,
    bool: false,
  },
};

test(
  'Ajv',
  measure => {
    const ajv = new Ajv();

    const schema = {
      $id: 'AjvTest',
      $schema: 'http://json-schema.org/draft-07/schema#',
      type: 'object',
      properties: {
        number: {
          type: 'number',
        },
        negNumber: {
          type: 'number',
        },
        maxNumber: {
          type: 'number',
        },
        string: {
          type: 'string',
        },
        longString: {
          type: 'string',
        },
        boolean: {
          type: 'boolean',
        },
        deeplyNested: {
          type: 'object',
          properties: {
            foo: {
              type: 'string',
            },
            num: {
              type: 'number',
            },
            bool: {
              type: 'boolean',
            },
          },
          required: ['foo', 'num', 'bool'],
        },
      },
      required: ['number', 'negNumber', 'maxNumber', 'string', 'longString', 'boolean', 'deeplyNested'],
    };

    const validate = ajv.compile(schema);

    measure(() => {
      validate(testData);
    });
  },
  { warmupIterationCount: 100, targetRme: 0.002 }
);

test(
  'myzod',
  measure => {
    const dataType = myzod.object(
      {
        number: myzod.number(),
        negNumber: myzod.number(),
        maxNumber: myzod.number(),
        string: myzod.string(),
        longString: myzod.string(),
        boolean: myzod.boolean(),
        deeplyNested: myzod.object(
          {
            foo: myzod.string(),
            num: myzod.number(),
            bool: myzod.boolean(),
          },
          {
            allowUnknown: true,
          }
        ),
      },
      {
        allowUnknown: true,
      }
    );

    measure(() => {
      dataType.parse(testData);
    });
  },
  { warmupIterationCount: 100, targetRme: 0.002 }
);

test(
  'lib',
  measure => {
    const dataType = lib
      .object({
        number: lib.number(),
        negNumber: lib.number(),
        maxNumber: lib.number(),
        string: lib.string(),
        longString: lib.string(),
        boolean: lib.boolean(),
        deeplyNested: lib
          .object({
            foo: lib.string(),
            num: lib.number(),
            bool: lib.boolean(),
          })
          .preserve(),
      })
      .preserve();

    measure(() => {
      dataType.parse(testData);
    });
  },
  { warmupIterationCount: 100, targetRme: 0.002 }
);
