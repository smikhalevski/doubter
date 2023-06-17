const nodeResolve = require('@rollup/plugin-node-resolve');
const dts = require('rollup-plugin-dts');
const fs = require('fs');
const path = require('path');

module.exports = fs
  .readdirSync('./src/main/plugin')
  .map(name => 'plugin/' + path.basename(name, '.ts'))
  .concat('index', 'core', 'helpers')
  .flatMap(name => [
    {
      input: './gen/' + name + '.js',
      output: [
        { file: './lib/' + name + '.js', format: 'cjs' },
        { file: './lib/' + name + '.mjs', format: 'es' },
      ],
      plugins: [nodeResolve()],
      external: /\.\/(plugin|core|helpers)/,
    },
    {
      input: './gen/' + name + '.d.ts',
      output: { file: './lib/' + name + '.d.ts', format: 'es' },
      plugins: [dts.default()],
      external: /\.\/(plugin|core|helpers)/,
    },
  ]);
