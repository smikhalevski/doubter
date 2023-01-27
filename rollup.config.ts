import nodeResolve from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';
import dts from 'rollup-plugin-dts';
import path from 'path';

export default [
  {
    input: './src/main/index.ts',
    output: [
      { file: './lib/index.js', format: 'cjs' },
      { file: './lib/index.mjs', format: 'es' },
    ],
    plugins: [nodeResolve(), typescript({ tslib: path.resolve('./src/main/tslib.ts') })],
  },
  {
    input: './src/main/index.ts',
    output: { file: './lib/index.d.ts', format: 'es' },
    plugins: [dts()],
  },
];
