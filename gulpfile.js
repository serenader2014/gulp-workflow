var del          = require('del');
var gulp         = require('gulp');
var path         = require('path');
var rev          = require('gulp-rev');
var sass         = require('gulp-sass');
var jade         = require('gulp-jade');
var size         = require('gulp-size');
var gulpsync     = require('gulp-sync')(gulp);
var qiniu        = require('gulp-qiniu');
var shell        = require('gulp-shell');
var vinylPaths   = require('vinyl-paths');
var uglify       = require('gulp-uglify');
var notify       = require('gulp-notify');
var filter       = require('gulp-filter');
var jshint       = require('gulp-jshint');
var useref       = require('gulp-useref');
var inject       = require('gulp-inject');
var plumber      = require('gulp-plumber');
var changed      = require('gulp-changed');
var csslint      = require('gulp-csslint');
var replace      = require('gulp-replace');
var minifyHtml   = require('gulp-htmlmin');
var browserSync  = require('browser-sync');
var htmlhint     = require('gulp-htmlhint');
var iconfont     = require('gulp-iconfont');
var ghPage       = require('gulp-gh-pages');
var imagemin     = require('gulp-imagemin');
var stylish      = require('jshint-stylish');
var minifyCss    = require('gulp-minify-css');
var sourcemaps   = require('gulp-sourcemaps');
var sprite       = require('gulp.spritesmith');
var bowerFile    = require('main-bower-files');
var ngAnnotate   = require('gulp-ng-annotate');
var revReplace   = require('gulp-rev-replace');
var autoPrefixer = require('gulp-autoprefixer');
var iconfontCss  = require('gulp-iconfont-css');

var config       = require('./config');
var cdn          = require('./cdn-config');
var scriptTmpl   = '<script type="text/javascript" src="{{src}}"></script>';
var cssTmpl      = '<link href="{{src}}" rel="stylesheet" />';
var dep;

function jshintNotify (file) {
    if (file.jshint.success) { return false; }

    var errors = file.jshint.results.map(function (data) {
        if (data.error) {
            return '(' + data.error.line + ':' + data.error.character + ') ' + data.error.reason;
        }
    }).join('\n');
    return 'JS hint: ' + file.relative + ' (' + file.jshint.results.length + ' errors)\n' + errors;
}

function csshintNotify (file) {
    if (file.csslint.success) { return false; }

    var errors = file.csslint.results.map(function (data) {
        if (data.error) {
            return data.error.line + ':' + data.error.message;
        }
    }).join('\n');
    return 'CSS hint: ' + file.relative + ' (' + file.csslint.results.length + ' errors)\n' + errors; 
}

function htmlhintNotify (file) {
    if (file.htmlhint.success) { return false; }

    var errors = file.htmlhint.messages.map(function (data) {
        if (data.error) {
            return data.error.line + ':' + data.error.message;
        }
    }).join('\n');
    return 'HTML hint: ' + file.relative + ' (' + file.htmlhint.errorCount + ' errors)\n' + errors;
}

function injectBowerFile () {
    return inject(gulp.src(bowerFile(), {read: false}), {
        name: 'bower',
        transform: function (filepath, file, i, length, target) {
            var tmpl;
            var flag    = true;
            var extname = path.extname(filepath);
            filepath    = filepath.substr(5);
            target      = target.path.split(__dirname)[1].split(path.sep).join('/').substr(4);
            flag        = dep[target].exclude.indexOf(filepath) === -1 ? true : false;
            if (!flag) { return; }

            if (extname === '.js') {
                tmpl = scriptTmpl;
            } else if (extname === '.css') {
                tmpl = cssTmpl;
            }
            return tmpl.replace('{{src}}', '{{@@asset}}' + filepath);
        }
    });
}

function injectScript () {
    return inject(gulp.src('./gulpfile.js', {read: false}), {
        name: 'scripts',
        transform: function (filepath, file, i, lenght, target) {
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
            var str = '';
            target  = target.path.split(__dirname)[1].split(path.sep).join('/').substr(4);
            dep[target].include.styles.forEach(function (s) {
                str = str + cssTmpl.replace('{{src}}', '{{@@asset}}' + s) + '\n';
            });
            return str;
        }
    });
}

gulp.task('serve', ['compile:css', 'compile:html', 'compile:js'], function () {
    browserSync.init({ server: { baseDir: './dist' }, port: 9000 });

    gulp.watch('dist/**').on('change', browserSync.reload);
    gulp.watch(['src/styles/**/*.scss'], ['sass']);
    gulp.watch('src/scripts/*.js', ['compile:js']);
    gulp.watch(['src/*.jade', 'dependencies-map.json'], ['compile:html']);
    gulp.watch('src/images/*.png', ['sprites']);
    gulp.watch('src/svgs/*.svg', ['iconfont']);
}); 

gulp.task('inject:dep', function () {
    dep = require('./dependencies-map.json');
    return gulp.src('./src/*.jade')
    .pipe(changed('./dist'))
    .pipe(jade({ pretty: true }))
    .pipe(htmlhint(config.htmlhint))
    .pipe(htmlhint.reporter())
    .pipe(notify(htmlhintNotify))
    .pipe(injectBowerFile())
    .pipe(injectScript())
    .pipe(injectCss())
    .pipe(gulp.dest('./dist'));
});

gulp.task('asset:local', function () {
    return gulp.src('./dist/*.html')
    .pipe(replace(/{{@@asset}}/ig, ''))
    .pipe(gulp.dest('./dist'));
});

gulp.task('asset:cdn', function () {
    return gulp.src('./dist/*.html')
    .pipe(replace(/{{@@asset}}/ig, '.'))
    .pipe(gulp.dest('./dist'));
});

gulp.task('qiniu', function () {
    return gulp.src(['./build/**/*', '!./build/*.html'])
    .pipe(qiniu({ 
        accessKey: cdn.qiniu.accessKey, 
        secretKey: cdn.qiniu.secretKey, 
        bucket: cdn.qiniu.bucket 
    }, {
        dir: cdn.qiniu.dir
    }));
});

gulp.task('sprites', function () {
    var imageFilter = filter('*.png');
    var sassFilter = filter('*.scss');
    return gulp.src('./src/images/icon/*')
    .pipe(sprite({ imgName: 'sprite.png', cssName: 'sprite.scss', imgPath: '{{@@asset}}/images/sprite.png' }))
    .pipe(imageFilter)
    .pipe(gulp.dest('./dist/images'))
    .pipe(imageFilter.restore())
    .pipe(sassFilter)
    .pipe(gulp.dest('./src/styles/vars'));
});

gulp.task('iconfont', function () {
    return gulp.src('./src/svgs/*', {base: './src'})
    .pipe(iconfontCss({ 
        fontName: 'iconfont', 
        fontPath: '../fonts/',
        path: 'scss', 
        targetPath: '../../src/styles/vars/iconfont.scss',
        normalize: true
    }))
    .pipe(iconfont({ fontName: 'iconfont' }))
    .pipe(gulp.dest('./dist/fonts/'));
});

gulp.task('compile:js', function () {
    return gulp.src('./src/scripts/*.js')
    .pipe(changed('./dist/scripts'))
    .pipe(ngAnnotate({ single_quotes: true}))
    .pipe(jshint(config.jshint))
    .pipe(jshint.reporter(stylish))
    .pipe(notify(jshintNotify))
    .pipe(gulp.dest('./dist/scripts'));
});

gulp.task('compile:css', gulpsync.sync(['sprites', 'iconfont', 'sass']));

gulp.task('sass', function () {
    return gulp.src('./src/styles/*.scss')
    .pipe(plumber())
    .pipe(sourcemaps.init())
    .pipe(sass({outputStyle: 'expanded'}))
    .pipe(autoPrefixer({browsers: ['last 2 versions']}))
    .pipe(csslint(config.csslint))
    .pipe(csslint.reporter())
    .pipe(notify(csshintNotify))
    .pipe(replace(/{{@@asset}}/ig, ''))
    .pipe(sourcemaps.write('./'))
    .pipe(gulp.dest('./dist/styles'));
});

gulp.task('compile:html', gulpsync.sync(['inject:dep', 'asset:local']));

gulp.task('compile', ['compile:js', 'compile:html', 'compile:css']);

gulp.task('build:html', function () {
    return gulp.src('./build/*.html')
    .pipe(size({ showFiles: true }))
    .pipe(minifyHtml({ collapseWhitespace: true }))
    .pipe(size({ showFiles: true }))
    .pipe(gulp.dest('./build'));
});

gulp.task('build:assets', ['clean', 'compile'], function () {
    var jsFilter = filter('**/*.js', {restore: true});
    var cssFilter = filter('**/*.css');
    var assets = useref.assets();

    return gulp.src('./dist/*.html')
    .pipe(assets)
    .pipe(size({ showFiles: true }))
    .pipe(sourcemaps.init())
    .pipe(jsFilter)
    .pipe(uglify())
    .pipe(jsFilter.restore())
    .pipe(cssFilter)
    .pipe(minifyCss())
    .pipe(cssFilter.restore())
    .pipe(rev())
    .pipe(size({ showFiles: true }))
    .pipe(sourcemaps.write('./'))
    .pipe(assets.restore())
    .pipe(useref())
    .pipe(revReplace())
    .pipe(gulp.dest('./build'));
});

gulp.task('build:img', function () {
    return gulp.src('./dist/images/**/*')
    .pipe(imagemin())
    .pipe(gulp.dest('./build/images'));
});

gulp.task('build:iconfont', function () {
    return gulp.src('./dist/fonts/*')
    .pipe(gulp.dest('./build/fonts'));
});

gulp.task('clean', function () {
    return gulp.src('./build')
        .pipe(vinylPaths(del));
});

gulp.task('build', gulpsync.sync(['init', 'build:assets', 'build:html', 'build:img', 'build:iconfont']));

gulp.task('deploy', function () {
    return gulp.src('./build/**/*')
    .pipe(ghPage({ remoteUrl: 'git@github.com:serenader2014/gulp-workflow.git', branch: 'gh-pages' }));
});

gulp.task('init', shell.task(['bower install']));

gulp.task('default', ['serve']);