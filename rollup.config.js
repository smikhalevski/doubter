const nodeResolve = require('@rollup/plugin-node-resolve');
const alias = require('@rollup/plugin-alias');
const dts = require('rollup-plugin-dts');
const fs = require('fs');
const path = require('path');

const entries = fs
  .readdirSync('src/main/plugin')
  .map(e => 'plugin/' + path.basename(e, '.ts'))
  .concat('index', 'core', 'utils');

const plugins = [
  nodeResolve(),

  alias({
    entries: { tslib: path.resolve('gen/tslib.js') },
  }),

  // Rewrite relative imports and exports
  { renderChunk: (code, chunk) => code.replace(/(require\(|from )'\.[^']+/g, '$&' + path.extname(chunk.fileName)) },
];

module.exports = entries.flatMap(e => {
  const external = RegExp(
    entries
      .filter(x => x !== e)
      .map(e => '\\./' + e)
      .join('|')
  );

  return [
    {
      input: `gen/${e}.js`,
      output: [
        { file: `lib/${e}.js`, format: 'cjs' },
        { file: `lib/${e}.mjs`, format: 'es' },
      ],
      plugins,
      external,
    },
    {
      input: `gen/${e}.d.ts`,
      output: { file: `lib/${e}.d.ts`, format: 'es' },
      plugins: [dts.default()],
      external,
    },
  ];
});
