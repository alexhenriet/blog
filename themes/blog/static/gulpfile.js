var gulp = require('gulp'),
    autoprefixer = require('gulp-autoprefixer'),
    cssnano = require('gulp-cssnano'),
    rename = require('gulp-rename'),
    concat = require('gulp-concat'),
    uglify = require('gulp-uglify'),
    del = require('del');

gulp.task('styles', function() {
  return gulp.src(['./css/normalize.min.css', './css/font-awesome.min.css', './css/main.css'])
    .pipe(autoprefixer('last 2 version'))
    .pipe(concat('merged.css'))
    .pipe(rename({suffix: '.min'}))
    .pipe(cssnano())
    .pipe(gulp.dest('./css/'))
});

gulp.task('scripts', function() {
  return gulp.src(['./js/vendor/jquery-1.12.4.min.js','./js/vendor/jquery.stoc.js','./js/main.js'])
    .pipe(concat('merged.js'))
    .pipe(rename({suffix: '.min'}))
    .pipe(uglify())
    .pipe(gulp.dest('./js/'))
});

gulp.task('clean', function() {
    return del(['./css/merged.min.css', './js/merged.min.js']);
});

gulp.task('default', ['clean'], function() {
    gulp.start('styles', 'scripts');
});
