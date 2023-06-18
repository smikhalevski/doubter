const nodeResolve = require('@rollup/plugin-node-resolve');
const alias = require('@rollup/plugin-alias');
const dts = require('rollup-plugin-dts');
const fs = require('fs');
const path = require('path');

module.exports = fs
  .readdirSync('./src/main/plugin')
  .map(name => 'plugin/' + path.basename(name, '.ts'))
  .concat('index', 'core', 'utils')
  .flatMap(name => [
    {
      input: './gen/' + name + '.js',
      output: [
        { file: './lib/' + name + '.js', format: 'cjs' },
        { file: './lib/' + name + '.mjs', format: 'es' },
      ],
      plugins: [
        nodeResolve(),
        alias({
          entries: [{ find: 'tslib', replacement: path.resolve('./gen/tslib') }],
        }),
      ],
      external: /\.\/(plugin|core|utils)/,
    },
    {
      input: './gen/' + name + '.d.ts',
      output: { file: './lib/' + name + '.d.ts', format: 'es' },
      plugins: [dts.default()],
      external: /\.\/(plugin|core|utils)/,
    },
  ]);
