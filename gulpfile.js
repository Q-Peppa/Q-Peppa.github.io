const gulp = require('gulp');
const edit = require('gulp-edit');
// copt dist/** to root
gulp.task('copy', (callback) => {
  // gulp 修改文件内容
  gulp
    .src('./dist/*.html')
    .pipe(
      edit(function (src, cb) {
        let err = null;
        let result = src.replace('/umi.js', '/dist/umi.js');
        cb(err, result);
      }),
    )
    .pipe(gulp.dest('./'));
  callback();
});
