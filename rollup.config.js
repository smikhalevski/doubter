const typescript = require('@rollup/plugin-typescript');

module.exports = {
  input: ['./src/main/index.ts', './src/main/core.ts', './src/main/utils.ts'],
  output: [
    { format: 'cjs', entryFileNames: '[name].js', dir: './lib', preserveModules: true },
    { format: 'es', entryFileNames: '[name].mjs', dir: './lib', preserveModules: true },
  ],
  plugins: [typescript({ tsconfig: './tsconfig.build.json' })],
};
