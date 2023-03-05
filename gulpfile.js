const gulp = require('gulp');

// copt dist/** to root
gulp.task('copy', (cb) => {
  return gulp.src('dist/**').pipe(gulp.dest('./'));
  cb();
});
