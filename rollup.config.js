const nodeResolve = require('@rollup/plugin-node-resolve');
const typescript = require('@rollup/plugin-typescript');
const dts = require('rollup-plugin-dts');
const path = require('path');

module.exports = [
  'index',
  'core',
  'plugins/index',
  'plugins/array',
  'plugins/number',
  'plugins/set',
  'plugins/string',
].flatMap(name => [
  {
    input: './src/main/' + name + '.ts',
    output: [
      { file: './lib/' + name + '.js', format: 'cjs' },
      { file: './lib/' + name + '.mjs', format: 'es' },
    ],
    plugins: [nodeResolve(), typescript({ tslib: path.resolve('./src/main/tslib.ts') })],
    external: /^doubter/,
  },
  {
    input: './src/main/' + name + '.ts',
    output: { file: './lib/' + name + '.d.ts', format: 'es' },
    plugins: [dts.default()],
    external: /^doubter/,
  },
]);
