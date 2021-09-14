import json from 'rollup-plugin-json'
import resolve from 'rollup-plugin-node-resolve'
import typescript from 'rollup-plugin-typescript2'

export default {
  input: 'src/index.ts',
  output: [
    {
      name: 'utils',
      file: 'dist/bundle.umd.js',
      format: 'umd',
      sourcemap: true
    },
    {
      name: 'utils',
      file: 'dist/bundle.esm.js',
      format: 'esm',
      sourcemap: true
    }
  ],
  plugins: [
    json(),
    resolve(),
    typescript()
  ]
}
