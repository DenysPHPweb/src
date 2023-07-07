// Gulp module imports
import {src, dest, watch, parallel, series} from 'gulp';
import browserSync from "browser-sync";
import rename from "gulp-rename";
import concat from "gulp-concat";
import postcss from "gulp-postcss";
import fileinclude from "gulp-file-include";
import minifyCss from "gulp-clean-css";
import purgecss from "gulp-purgecss";
import imagemin from "gulp-imagemin";
import uglify from "gulp-uglify-es";
import del from 'del';

// Directories
const dirs = {
  src: 'src',
  dev: 'dev',
  public: '../../../Public/'
};

// Compile Styles
const compileStyles = () => {
  return src(`${dirs.src}/css/tailwind.css`)
    .pipe(postcss({ tailwindcss: {}, autoprefixer: {} }))
    .pipe(rename({ basename: 'styles' }))
    .pipe(dest(`${dirs.dev}/css/`))
    .pipe(browserSync.reload({ stream: true }))
};

// Compile HTML
const compileHtml = ()=> {
  return src([`${dirs.src}/html/**/!(_)*.html`], {base: `${dirs.src}/html`})
    .pipe(fileinclude({ prefix: '@@', basepath: '@file'}))
    .pipe(dest(`${dirs.dev}/`))
    .pipe(browserSync.reload({ stream: true }))
};

  // Compile JavaScript
const compileScripts = done => {
  src([`${dirs.src}/js/lib/*.js`])
    .pipe(dest(`${dirs.dev}/js/lib`))

  src(`${dirs.src}/js/main.js`)
    .pipe(concat('scripts.js'))
    .pipe(dest(`${dirs.dev}/js`))
    .pipe(browserSync.reload({ stream: true }))

    done()
};

// Clean
const clean = () => del([
  `${dirs.dev}`, 
  `${dirs.public}/Css/*`, 
  `${dirs.public}/JavaScript/*`, 
  `${dirs.public}/Images/*`
], { force: true });

// Start BrowserSync
const startBrowserSync = () => {
  browserSync({
    server: { baseDir: `${dirs.dev}` },
    notify: false,
    open: true,
    tunnel: false
  })
};

// Copy Images
const copyImages = () => {
  return src([`${dirs.src}/img/**/!(_)*`])
    .pipe(imagemin([
      imagemin.mozjpeg({quality: 75, progressive: true})
    ]))
    .pipe(dest(`${dirs.dev}/img`))
}

// Watch Task
const devWatch = () => {
  watch(`${dirs.src}/css/tailwind.css`, compileStyles)
  watch(`${dirs.src}/html/**/*.html`, compileHtml)
  watch(`${dirs.src}/js/*.js`, compileScripts)
  watch('tailwind.config.js', compileStyles)
  watch(`${dirs.src}/img/*`, series(() => { return del([`${dirs.dev}/img/*`]) } ,copyImages))
};

// Copy files frod dev to prod folders
const copyToPublic = done => {
  src([`${dirs.dev}/css/*.css`])
    .pipe(purgecss({
      content: [`${dirs.dev}/**/*.html`],
      defaultExtractor: content => {
        const broadMatches = content.match(/[^<>"'`\s]*[^<>"'`\s:]/g) || []
        const innerMatches = content.match(/[^<>"'`\s.()]*[^<>"'`\s.():]/g) || []
        return broadMatches.concat(innerMatches)
      }
    }))
    .pipe(minifyCss())
    .pipe(dest(`${dirs.public}/Css`))

  src([`${dirs.dev}/js/lib/*.js`])
    .pipe(dest(`${dirs.public}/JavaScript/lib`))

  src([`${dirs.dev}/js/*.js`])
    .pipe(uglify())
    .pipe(dest(`${dirs.public}/JavaScript`))

  src([`${dirs.dev}/img/**/*`])
    .pipe(dest(`${dirs.public}/Images`))

  done()
}

// Development Task
export const dev = parallel(series(clean, parallel(compileStyles, compileHtml, compileScripts, copyImages), startBrowserSync), devWatch);

// Production Task
export const publish = series(clean, parallel(compileStyles, compileHtml, compileScripts, copyImages), copyToPublic);

// Default task
export default dev;