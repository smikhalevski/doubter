import nodeResolve from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';
import alias from '@rollup/plugin-alias';
import dts from 'rollup-plugin-dts';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default [
  {
    input: './src/main/index.ts',
    output: [
      { file: './lib/index.js', format: 'cjs' },
      { file: './lib/index.mjs', format: 'es' },
    ],
    plugins: [
      alias({
        entries: {
          tslib: path.resolve(__dirname, './src/main/tslib'),
        },
      }),
      nodeResolve(),
      typescript(),
    ],
  },
  {
    input: './src/main/index.ts',
    output: { file: './lib/index.d.ts', format: 'es' },
    plugins: [dts()],
  },
];
