var del          = require('del');
var gulp         = require('gulp');
var path         = require('path');
var sprity       = require('sprity');
var rev          = require('gulp-rev');
var shell        = require('gulp-shell');
var vinylPaths   = require('vinyl-paths');
var uglify       = require('gulp-uglify');
var notify       = require('gulp-notify');
var filter       = require('gulp-filter');
var browserSync  = require('browser-sync');
var concat       = require('gulp-concat');
var jshint       = require('gulp-jshint');
var rename       = require('gulp-rename');
var useref       = require('gulp-useref');
var bowerFile    = require('main-bower-files');
var inject       = require('gulp-inject');
var replace      = require('gulp-replace');
var iconfont     = require('gulp-iconfont');
var ghPage       = require('gulp-gh-pages');
var imagemin     = require('gulp-imagemin');
var sass         = require('gulp-ruby-sass');
var minifyCss    = require('gulp-minify-css');
var sourcemaps   = require('gulp-sourcemaps');
var ngAnnotate   = require('gulp-ng-annotate');
var revReplace   = require('gulp-rev-replace');
var autoPrefixer = require('gulp-autoprefixer');
var iconfontCss  = require('gulp-iconfont-css');

var scriptTmpl   = '<script type="text/javascript" src="{{src}}"></script>';
var cssTmpl      = '<link href="{{src}}" rel="stylesheet" />';


gulp.task('serve', ['compile-css', 'compile-html', 'compile-js'], function () {
    browserSync.init({
        server: { baseDir: './dist' },
        port: 9000
    });
    gulp.watch('./dist/**').on('change', browserSync.reload);
    gulp.watch('./src/styles/*.scss', ['compile-css']);
    gulp.watch('./src/scripts/*.js', ['compile-js']);
    gulp.watch(['./src/*.html', './dependencies-map.json'], ['compile-html']);
}); 

gulp.task('inject', function () {
    var dep = require('./dependencies-map.json');

    function injectBowerFile () {
        return inject(gulp.src(bowerFile(), {read: false}), {
            name: 'bower',
            transform: function (filepath, file, i, length, target) {
                var tmpl;
                var flag    = true;
                var extname = path.extname(filepath);
                filepath    = filepath.substr(5);
                target      = target.path.split(__dirname)[1].split(path.sep).join('/').substr(4);
                flag        = dep[target].exclude.indexOf(filepath) == -1 ? true : false;
                if (!flag) { return; }

                if (extname === '.js') {
                    tmpl = scriptTmpl;
                } else if (extname === '.css') {
                    tmpl = cssTmpl;
                }
                return tmpl.replace('{{src}}', '{{@@asset}}' + filepath);
            }
        })
    }
    function injectScript () {
        return inject(gulp.src('./gulpfile.js', {read: false}), {
            name: 'scripts',
            transform: function (filepath, file, i, lenght, target) {
                var extname;
                var str = '';
                target  = target.path.split(__dirname)[1].split(path.sep).join('/').substr(4);
                dep[target].include.scripts.forEach(function (s) {
                    str = str + scriptTmpl.replace('{{src}}', '{{@@asset}}' + s) + '\n';
                });
                return str;
            }
        });
    }
    function injectCss () {
        return inject(gulp.src('./gulpfile.js', {read: false}), {
            name: 'styles',
            transform: function (filepath, file, i, lenght, target) {
                var tmpl;
                var extname;
                var str = '';
                target  = target.path.split(__dirname)[1].split(path.sep).join('/').substr(4);
                dep[target].include.styles.forEach(function (s) {
                    str = str + cssTmpl.replace('{{src}}', '{{@@asset}}' + s) + '\n';
                });
                return str;
            }
        });
    }

    return gulp.src('./src/*.html')
    .pipe(injectBowerFile())
    .pipe(injectScript())
    .pipe(injectCss())
    .pipe(gulp.dest('./dist'))
    .pipe(notify('inject dependencies to html files successfully'));
});

gulp.task('localasset', ['inject'], function () {
    return gulp.src('./dist/*.html')
    .pipe(replace(/{{@@asset}}/ig, '.'))
    .pipe(gulp.dest('./dist'))
    .pipe(notify('use local asset'));
});

gulp.task('compile-js', function () {
    return gulp.src('./src/scripts/*.js')
    .pipe(ngAnnotate({ single_quotes: true}))
    .pipe(gulp.dest('./dist/scripts'))
    .pipe(notify('js file compile successfully'));
});

gulp.task('compile-html', ['inject', 'localasset']);

gulp.task('compile-css', function () {
    return sass('./src/styles/app.scss', {style: 'expanded', sourcemap: true})
    .on('error', function (err) {
        console.log('Compile sass failed: ' + err.message);
    })
    .pipe(autoPrefixer({browsers: ['last 2 versions']}))
    .pipe(sourcemaps.write('./'))
    .pipe(gulp.dest('./dist/styles'))
    .pipe(notify('sass file compile successfully'));
});

gulp.task('build', ['clean'], function () {
    var jsFilter = filter('**/*.js', {restore: true});
    var cssFilter = filter('**/*.css');
    var assets = useref.assets();

    return gulp.src('./dist/*.html')
    .pipe(assets)
    .pipe(sourcemaps.init())
    .pipe(jsFilter)
    .pipe(uglify())
    .pipe(jsFilter.restore())
    .pipe(cssFilter)
    .pipe(minifyCss())
    .pipe(cssFilter.restore())
    .pipe(rev())
    .pipe(sourcemaps.write('./'))
    .pipe(assets.restore())
    .pipe(useref())
    .pipe(revReplace())
    .pipe(gulp.dest('./build'))
    .pipe(notify('project build successfully'));
});

gulp.task('clean', function (cb) {
    return gulp.src('./build')
        .pipe(vinylPaths(del))
        .pipe(notify('delete previous built folder'));
});

gulp.task('init', shell.task(['bower install']));

gulp.task('default', ['serve']);