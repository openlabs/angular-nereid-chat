'use strict';

var gulp   = require('gulp');
var jshint = require('gulp-jshint');
var karma = require('gulp-karma');


// Lint Task
gulp.task('lint', function() {
  return gulp.src(['*.js', 'example/*.js', 'test/**/*.js'])
    .pipe(jshint())
    .pipe(jshint.reporter('default'));
});

// Karma
gulp.task('karma', function () {
  // Pass dummy glob just to create instance, so that karma will pick files
  // from karma.conf.js not from glob
  return gulp.src('_')
    .pipe(karma({
      configFile: 'test/karma.conf.js',
      action: 'run'
    }))
    .on('error', function(err) {
      // Make sure failed tests cause gulp to exit non-zero
      throw err;
    });
});

// Test
gulp.task('test', ['lint', 'karma']);

// Default
gulp.task('default', ['lint']);
