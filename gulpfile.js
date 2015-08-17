var del          = require('del');
var gulp         = require('gulp');
var path         = require('path');
var rev          = require('gulp-rev');
var sass         = require('gulp-sass');
var jade         = require('gulp-jade');
var size         = require('gulp-size');
var gulpsync     = require('gulp-sync')(gulp);
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

// inject bower's dependencies to html files
function injectBowerFile () {
    return inject(gulp.src(bowerFile(), {read: false}), {
        name: 'bower',
        transform: function (filepath, file, i, length, target) {
            var tmpl;
            var flag    = true;
            var extname = path.extname(filepath);

            // remove `/dist` string
            filepath    = filepath.substr(5); 

            // remove `/src` string
            target      = target.path.split(__dirname)[1].split(path.sep).join('/').substr(4);

            // decide whether gulp should inject this bower dependencies to the html file or not.
            flag        = dep[target].exclude.indexOf(filepath) === -1 ? true : false;
            if (!flag) { return; }

            // use different template according to the extname.
            if (extname === '.js') {
                tmpl = scriptTmpl;
            } else if (extname === '.css') {
                tmpl = cssTmpl;
            }
            return tmpl.replace('{{src}}', filepath);
        }
    });
}

function injectScript () {
    return inject(gulp.src('./gulpfile.js', {read: false}), {
        name: 'scripts',
        transform: function (filepath, file, i, lenght, target) {
            var str = '';

            // remove `/src` string
            target  = target.path.split(__dirname)[1].split(path.sep).join('/').substr(4);

            // inject additional dependencies to html files.
            // notice that there are multiple html files, so it is more difficult to inject assets,
            // due to different html files require different assets, so there is no common pattern.
            dep[target].include.scripts.forEach(function (s) {
                str = str + scriptTmpl.replace('{{src}}',  s) + '\n';
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
                str = str + cssTmpl.replace('{{src}}', s) + '\n';
            });
            return str;
        }
    });
}

// run developing environment, and watch files' changes.
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
    // use a json file to declare the html files' dependencies.
    dep = require('./dependencies-map.json');

    return gulp.src('./src/*.jade')
    .pipe(changed('./dist'))

    // compile jade to html
    .pipe(jade({ pretty: true })) 

    // htmlhint, check the code's quality
    .pipe(htmlhint(config.htmlhint))
    .pipe(htmlhint.reporter())

    // if error was found, it will notify you
    .pipe(notify(htmlhintNotify))

    // replace the assets' placeholder to the actual code
    .pipe(injectBowerFile())
    .pipe(injectScript())
    .pipe(injectCss())

    .pipe(gulp.dest('./dist'));
});


gulp.task('sprites', function () {
    var imageFilter = filter('*.png');
    var sassFilter = filter('*.scss');
    return gulp.src('./src/images/icon/*')

    // generate image sprite, it will output scss files stream and image file stream
    .pipe(sprite({ imgName: 'sprite.png', cssName: 'sprite.scss', imgPath: '../images/sprite.png' }))

    // filter all the image files
    .pipe(imageFilter)

    // save the image file to /dist/images folder
    .pipe(gulp.dest('./dist/images'))

    // return all files
    .pipe(imageFilter.restore())

    // filter all sass files
    .pipe(sassFilter)

    // save them to /src/styles/vars folder
    .pipe(gulp.dest('./src/styles/vars'));
});

gulp.task('iconfont', function () {
    return gulp.src('./src/svgs/*', {base: './src'})

    // configure the scss file that generated by iconfont
    .pipe(iconfontCss({ 
        fontName: 'iconfont', 
        fontPath: '../fonts/',
        path: 'scss', 
        targetPath: '../../src/styles/vars/iconfont.scss',
        normalize: true
    }))

    // generate iconfont, using svg files
    .pipe(iconfont({ fontName: 'iconfont' }))

    .pipe(gulp.dest('./dist/fonts/'));
});

gulp.task('compile:js', function () {
    return gulp.src('./src/scripts/*.js')
    .pipe(changed('./dist/scripts'))

    // auto complete the angular's annotate
    .pipe(ngAnnotate({ single_quotes: true}))

    // run jshint, check the code's quality
    .pipe(jshint(config.jshint))

    // if error was found, it will let you know through notifier
    .pipe(jshint.reporter(stylish))
    .pipe(notify(jshintNotify))

    .pipe(gulp.dest('./dist/scripts'));
});

// use gulpsync to make sure `sass` task is excuted after `sprites` and `iconfont` tasks.
gulp.task('compile:css', gulpsync.sync(['sprites', 'iconfont', 'sass']));

gulp.task('sass', function () {
    return gulp.src('./src/styles/*.scss')
    .pipe(plumber())

    // use sourcemaps to help developer to debug.
    .pipe(sourcemaps.init())

    // compile the sass file to css file.
    .pipe(sass({outputStyle: 'expanded'}))

    // add vendor prefixes to the css file
    .pipe(autoPrefixer({browsers: ['last 2 versions']}))

    // csslint, check code's quality
    .pipe(csslint(config.csslint))

    .pipe(csslint.reporter())
    .pipe(notify(csshintNotify))

    .pipe(sourcemaps.write('./'))

    .pipe(gulp.dest('./dist/styles'));
});

gulp.task('compile:html', ['inject:dep']);

gulp.task('compile', ['compile:js', 'compile:html', 'compile:css']);

gulp.task('build:html', function () {
    return gulp.src('./build/*.html')
    .pipe(size({ showFiles: true }))

    // minify the html files to reduce the file's size.
    .pipe(minifyHtml({ collapseWhitespace: true }))

    .pipe(size({ showFiles: true }))
    .pipe(gulp.dest('./build'));
});

gulp.task('build:assets', ['clean', 'compile'], function () {
    var jsFilter = filter('**/*.js', {restore: true});
    var cssFilter = filter('**/*.css');
    var assets = useref.assets();

    return gulp.src('./dist/*.html')

    // filter out the html file's asset
    .pipe(assets)
    .pipe(size({ showFiles: true }))

    // use sourcemaps to help developers to debug.
    .pipe(sourcemaps.init())

    // filter out the js file, and minify them.
    .pipe(jsFilter)
    .pipe(uglify())
    .pipe(jsFilter.restore())

    // filter out the css file, and minify them.
    .pipe(cssFilter)
    .pipe(minifyCss())
    .pipe(cssFilter.restore())

    // assets revision
    .pipe(rev())
    .pipe(size({ showFiles: true }))
    .pipe(sourcemaps.write('./'))
    .pipe(assets.restore())


    .pipe(useref())

    // Substitute in new filenames 
    .pipe(revReplace())
    .pipe(gulp.dest('./build'));
});

gulp.task('build:img', function () {
    return gulp.src('./dist/images/**/*')

    // minify the image
    .pipe(imagemin())

    .pipe(gulp.dest('./build/images'));
});

gulp.task('build:iconfont', function () {
    // copy the iconfont to the build folder
    return gulp.src('./dist/fonts/*')
    .pipe(gulp.dest('./build/fonts'));
});

gulp.task('clean', function () {
    // delete build folder
    return gulp.src('./build')
        .pipe(vinylPaths(del));
});

gulp.task('build', gulpsync.sync(['init', 'build:assets', 'build:html', 'build:img', 'build:iconfont']));

gulp.task('deploy', function () {
    return gulp.src('./build/**/*')

    // publish the build folder's content to the github page
    .pipe(ghPage({ remoteUrl: 'git@github.com:serenader2014/gulp-workflow.git', branch: 'gh-pages' }));
});

gulp.task('init', shell.task(['bower install']));

gulp.task('default', ['serve']);