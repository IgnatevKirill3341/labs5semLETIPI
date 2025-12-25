import gulp from 'gulp';
import less from 'gulp-less';
import sass from 'gulp-sass';
import babel from 'gulp-babel';
import uglify from 'gulp-uglify';
import cleanCSS from 'gulp-clean-css';
import concat from 'gulp-concat';
import rename from 'gulp-rename';
import del from 'del';
import replace from 'gulp-replace';
import * as dartSass from 'sass';

const sassCompiler = sass(dartSass);

const paths = {
    src: {
        html: 'src/html/**/*.html',
        js: 'src/js/**/*.js',
        less: 'src/less/**/*.less',
        sass: 'src/sass/**/*.scss'
    },
    dist: 'dist-gulp'
};

// Clean dist directory
export function clean() {
    return del([paths.dist]);
}

// Copy HTML files
export function copyHtml() {
    return gulp.src(paths.src.html)
        .pipe(gulp.dest(paths.dist));
}

// Compile LESS to CSS
export function compileLess() {
    return gulp.src(paths.src.less)
        .pipe(less())
        .pipe(concat('styles.css'))
        .pipe(gulp.dest(`${paths.dist}`))
        .pipe(cleanCSS())
        .pipe(rename({ suffix: '.min' }))
        .pipe(gulp.dest(`${paths.dist}`));
}

// Compile SASS to CSS (alternative)
export function compileSass() {
    return gulp.src(paths.src.sass)
        .pipe(sassCompiler().on('error', sassCompiler.logError))
        .pipe(concat('styles.css'))
        .pipe(gulp.dest(`${paths.dist}`))
        .pipe(cleanCSS())
        .pipe(rename({ suffix: '.min' }))
        .pipe(gulp.dest(`${paths.dist}`));
}

// Compile and minify JavaScript with Babel
export function compileJs() {
    return gulp.src(paths.src.js)
        .pipe(replace(/^\/\/ Import styles for webpack build\s*\nimport ['"].*styles\.less['"];?\s*\n/gm, ''))
        .pipe(babel({
            presets: ['@babel/preset-env']
        }))
        .pipe(gulp.dest(`${paths.dist}`))
        .pipe(uglify())
        .pipe(rename({ suffix: '.min' }))
        .pipe(gulp.dest(`${paths.dist}`));
}

// Watch files
export function watch() {
    gulp.watch(paths.src.html, copyHtml);
    gulp.watch(paths.src.js, compileJs);
    gulp.watch(paths.src.less, compileLess);
    gulp.watch(paths.src.sass, compileSass);
}

// Build task
export const build = gulp.series(
    clean,
    gulp.parallel(copyHtml, compileLess, compileJs)
);

// Default task
export default build;

