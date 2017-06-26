import gulp from 'gulp'
import source from 'vinyl-source-stream'
import buffer from 'vinyl-buffer'
import gutil from 'gulp-util'
import imagemin from 'gulp-imagemin'
import cache from 'gulp-cache'
import handlebars from 'gulp-compile-handlebars'
import sass from 'gulp-sass'
import sourcemaps from 'gulp-sourcemaps'
import autoprefixer from 'gulp-autoprefixer'
import uglifycss from 'gulp-uglifycss'
import browserify from 'browserify'
import babelify from 'babelify'
import watchify from 'watchify'
import notify from 'gulp-notify'
import uglify from 'gulp-uglify'
import rename from 'gulp-rename'
import browsersync from 'browser-sync'
const reload = browsersync.reload

const PATHS = {
  app: 'app',
  build: 'dist'
}

const FILES = {
  ico: 'app/*.ico',
  pdf: 'app/*.pdf',
  html: 'app/**/*.html',
  hbs: 'app/templates/views/*.hbs',
  img: 'app/img/**/*.+(png|jpg|svg)',
  sass: 'app/sass/**/*.scss',
  js: 'app/js/**/*.js',
  main: 'main.js'
}

//  static files --> dist
gulp.task('static', () => {
  gulp.src(FILES.ico)
    .pipe(gulp.dest('dist'))
  gulp.src(FILES.pdf)
    .pipe(gulp.dest('dist'))
  // gulp.src(FILES.html)
  //   .pipe(gulp.dest('dist'))
    .pipe(reload({ stream: true }))
})

gulp.task('hbs', () => {
  // const options = {
  //   ignorePartials: true,
  //   batch: [ './app/templates/partials' ]
  // }
  gulp.src(FILES.hbs)
    .pipe(handlebars({}, {
      ignorePartials: true,
      batch: [ './app/templates/partials' ]
    }))
    .pipe(rename(path => {
      gutil.log(path)
      path.dirname = path.basename !== 'landing' ? path.basename : path.dirname
      path.basename = 'index'
      path.extname = '.html'
    }))
    .pipe(gulp.dest('dist'))
    .pipe(reload({ stream: true }))
})

//  images --> minify + cache --> dist
gulp.task('img', () => {
  gulp.src(FILES.img)
    .pipe(cache(imagemin({ interlaced: true })))
    .pipe(gulp.dest(PATHS.build + '/assets/img'))
    .pipe(reload({ stream: true }))
})

//  sass --> css --> dist
gulp.task('sass', () => {
  gulp.src(FILES.sass)
    .pipe(sourcemaps.init())
    .pipe(sass())
    .on('error', handleErrors)
    .pipe(rename('styles.css'))
    .pipe(gulp.dest(PATHS.build + '/assets/css'))
    // .pipe(autoprefixer())
    // .pipe(autoprefixer({ remove: false, browsers: ['last 2 versions', '> 1%'] }))
    // .pipe(uglifycss())
    .pipe(rename('styles.min.css'))
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest(PATHS.build + '/assets/css'))
    .pipe(reload({ stream: true }))
})

//  es6 --> js --> dist
gulp.task('js', () => {
  return build(FILES.main, false)
})

//  browser-sync --> local server
gulp.task('browser-sync', () => {
  browsersync.init({
    server: { baseDir: 'dist' },
    ghostMode: true,
    notify: false,
    open: false
  })
})

gulp.task('default', ['static', 'img', 'sass', 'js', 'browser-sync', 'hbs'], () => {
  gulp.watch(FILES.html, ['static'])
  gulp.watch(FILES.img, ['img'])
  gulp.watch(FILES.sass, ['sass'])
  gulp.watch('./app/templates/**/*.hbs', ['hbs'])
  return build(FILES.main, true)
})

function handleErrors(...args) {
  notify.onError({
    title: 'Compile Error',
    message: '<%= error.message %>'
  }).apply(this, args)
  this.emit('end')
}

function build(file, watch) {
  const options = {
    entries: [ PATHS.app + '/js/' + file ],
    transform: [ babelify ],
    debug: true
  }
  let bundler = watch ? watchify(browserify(options)) : browserify(options)
  function rebundle() {
    const stream = bundler.bundle()
    return stream
      .on('error', handleErrors)
      .pipe(source(file))
      .pipe(buffer())
      .pipe(rename('main.js'))
      .pipe(gulp.dest(PATHS.build + '/assets/js'))
      .pipe(uglify())
      .pipe(rename('main.min.js'))
      .pipe(gulp.dest(PATHS.build + '/assets/js'))
      .pipe(reload({ stream: true }))
  }
  bundler.on('update', function() {
    rebundle()
    gutil.log('rebundling..')
  })
  return rebundle()
}
