const alias = require('@rollup/plugin-alias');
const typescript = require('@rollup/plugin-typescript');

module.exports = {
  input: ['./lib/index.ts', './lib/core.ts'],
  output: [
    { format: 'cjs', entryFileNames: '[name].js', dir: './lib', preserveModules: true, sourcemap: 'inline' },
    { format: 'es', entryFileNames: '[name].mjs', dir: './lib', preserveModules: true, sourcemap: 'inline' },
  ],
  plugins: [
    alias({
      entries: { tslib: require.resolve('./lib/tslib.mjs') },
    }),
    typescript({ tsconfig: './tsconfig.build.json' }),
  ],
};
