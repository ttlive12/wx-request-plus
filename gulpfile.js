const gulp = require('gulp');
const ts = require('gulp-typescript');
const sourcemaps = require('gulp-sourcemaps');
const clean = require('gulp-clean');
const { series, parallel } = require('gulp');

// 加载TypeScript配置
const tsProject = ts.createProject('tsconfig.json', {
  // 覆盖tsconfig.json中的一些选项
  emitDeclarationOnly: false,  // 我们需要输出JS文件
});

// 清理构建目录
function cleanDist() {
  return gulp.src(['dist', 'types'], { allowEmpty: true, read: false })
    .pipe(clean());
}

// 编译TypeScript
function compileTS() {
  const tsResult = gulp.src('src/**/*.ts')
    .pipe(sourcemaps.init())
    .pipe(tsProject());
  
  // 输出类型声明文件
  tsResult.dts
    .pipe(gulp.dest('types'));
  
  // 输出JS文件
  return tsResult.js
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest('dist'));
}

// 复制其他资源文件（如有需要）
function copyResources() {
  return gulp.src(['src/**/*.json', 'src/**/*.d.ts'])
    .pipe(gulp.dest('dist'));
}

// 监视文件变化
function watchFiles() {
  gulp.watch('src/**/*.ts', compileTS);
  gulp.watch(['src/**/*.json', 'src/**/*.d.ts'], copyResources);
}

// 定义任务
exports.clean = cleanDist;
exports.build = series(cleanDist, parallel(compileTS, copyResources));
exports.watch = watchFiles;
exports.default = exports.build; 