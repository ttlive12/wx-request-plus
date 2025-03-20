/**
 * 现在使用 swc 编译 ts 到 es5
 * 通过 esbuild 进行 bundle
 * (也可以选择直接使用 swc 一步到位)
 */

// swc 配置
const swcOptions = {
  jsc: {
    parser: {
      syntax: 'typescript',
      tsx: false,
      decorators: false,
      dynamicImport: false,
    },
    transform: null,
    target: 'es5',
    externalHelpers: false,
    keepClassNames: false,
    minify: {
      compress: {
        unused: true,
        pure_funcs: [
          'console.log',    // 移除 console.log
          'console.debug',  // 移除 console.debug
          'console.info'    // 移除 console.info
        ]
      },
      mangle: true,
    },
  },
  minify: false,
  module: {
    type: 'commonjs',
    strict: false,
    strictMode: true,
    lazy: false,
    noInterop: false,
  },
}

// esbuild 配置
const esbuildOptions = {
  outfile: 'index.js',
  bundle: true,
  format: 'cjs',
  minify: true,
  external: ['lru-cache'],
}

export interface BuildConfig {
  swcOptions: any
  esbuildOptions: any
}

export const buildConfig: BuildConfig = {
  swcOptions,
  esbuildOptions,
}