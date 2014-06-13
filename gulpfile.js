'use strict';

var gulp   = require('gulp');
var jshint = require('gulp-jshint');

// Lint Task
gulp.task('lint', function() {
  return gulp.src(['*.js', 'example/*.js'])
    .pipe(jshint())
    .pipe(jshint.reporter('default'));
});

// Test
gulp.task('test', ['lint']);

// Default
gulp.task('default', ['lint']);
