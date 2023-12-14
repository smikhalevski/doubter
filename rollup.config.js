const alias = require('@rollup/plugin-alias');
const typescript = require('@rollup/plugin-typescript');

module.exports = {
  input: ['./src/main/index.ts', './src/main/core.ts'],
  output: [
    { format: 'cjs', entryFileNames: '[name].js', dir: './lib', preserveModules: true },
    { format: 'es', entryFileNames: '[name].mjs', dir: './lib', preserveModules: true },
  ],
  plugins: [
    alias({
      entries: { tslib: require.resolve('./src/main/tslib.mjs') },
    }),
    typescript({ tsconfig: './tsconfig.build.json' }),
  ],
};
