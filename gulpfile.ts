import gulp from 'gulp'
import clean from 'gulp-clean'
import tsc from 'gulp-typescript'
import path from 'path'
import swc from 'gulp-swc'
import esbuild from 'gulp-esbuild'
import watch from 'gulp-watch'

import config from './config'

const {
  srcPath,
  esbuildOptions,
  swcOptions,
  bundlePath,
  typesPath,
  tsConfigPath,
  swcBuildPath,
  entry,
} = config

const genTsc = () => {
  return tsc.createProject(tsConfigPath)
}

gulp.task('clean-bundle', () => {
  return gulp.src(bundlePath, { allowEmpty: true }).pipe(clean())
})

gulp.task('clean-dts', () => {
  return gulp.src(typesPath, { allowEmpty: true }).pipe(clean())
})

gulp.task('gen-dts', () => {
  const tsc = genTsc()
  return tsc.src().pipe(tsc()).pipe(gulp.dest(typesPath))
})

gulp.task('swc-ts-2-js', () => {
  return gulp.src(path.resolve(srcPath, '*.ts')).pipe(swc(swcOptions)).pipe(gulp.dest(swcBuildPath))
})

gulp.task('esbuild-bundle', () => {  
  return gulp  
    .src(path.resolve(swcBuildPath, `${entry}.js`))  
    .pipe(esbuild(esbuildOptions))
    .on('error', function handleError(e) {  // 添加错误处理
      console.error('ESBuild error:', e);
      //@ts-ignore
      this.emit('end');  // 确保任务正常结束
    })  
    .pipe(gulp.dest(bundlePath))  
});

gulp.task('esbuild-bundle-dev', () => {
  return gulp
    .src(path.resolve(swcBuildPath, `${entry}.js`))
    .pipe(esbuild({ ...esbuildOptions, minify: false, outfile: 'index.dev.js' }))
    .pipe(gulp.dest(bundlePath))
})

gulp.task('watch', () => {
  const tsFile = path.resolve(srcPath, '*.ts')
  // @ts-ignore
  const watcher = watch(tsFile, gulp.series('dev'))
  watcher.on('change', function (path, stats) {
    console.log(`File ${path} was changed`)
  })
})

// build for develop
gulp.task(
  'dev',
  gulp.series(
    'swc-ts-2-js',
    'esbuild-bundle-dev',
  ),
)

// build for develop & watch
gulp.task('dev-watch', gulp.series('dev', 'watch'))
// generate .d.ts
gulp.task('dts', gulp.series('clean-dts', 'gen-dts'))
// build for publish
gulp.task('default', gulp.series('clean-bundle', 'swc-ts-2-js', 'esbuild-bundle', 'dts'))