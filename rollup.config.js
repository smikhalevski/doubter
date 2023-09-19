const nodeResolve = require('@rollup/plugin-node-resolve');
const alias = require('@rollup/plugin-alias');
const dts = require('rollup-plugin-dts');
const fs = require('fs');
const path = require('path');

module.exports = fs
  .readdirSync('src/main/plugin')
  .map(it => 'plugin/' + path.basename(it, '.ts'))
  .concat('index', 'core', 'utils')
  .flatMap((input, _, inputs) => [
    {
      input: `gen/${input}.js`,
      output: [
        { file: `lib/${input}.js`, format: 'cjs' },
        { file: `lib/${input}.mjs`, format: 'es' },
      ],
      plugins: [
        nodeResolve(),

        alias({
          entries: { tslib: path.resolve('gen/tslib.js') },
        }),

        // Append a file extension to relative imports and exports
        {
          renderChunk: (code, chunk) => code.replace(/(require\(|from )'\.[^']+/g, '$&' + path.extname(chunk.fileName)),
        },
      ],
      external: inputs.map(input => RegExp('\\./' + input)),
    },
    {
      input: `gen/${input}.d.ts`,
      output: { file: `lib/${input}.d.ts`, format: 'es' },
      plugins: [dts.default()],
      external: inputs.map(input => RegExp('\\./' + input)),
    },
  ]);
