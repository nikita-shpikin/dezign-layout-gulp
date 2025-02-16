import browserSync from 'browser-sync'
import { deleteAsync } from 'del'
import fs from 'fs'
import gulp from 'gulp'
import autoPrefixer from 'gulp-autoprefixer'
import babel from 'gulp-babel'
import cssO from 'gulp-csso'
import favicons from 'gulp-favicons'
import filter from 'gulp-filter'
import fonter from 'gulp-fonter'
import mediaQueries from 'gulp-group-css-media-queries'
import gulpIf from 'gulp-if'
import imagemin from 'gulp-imagemin'
import newer from 'gulp-newer'
import gulpNotify from 'gulp-notify'
import gulpPlumber from 'gulp-plumber'
import GulpPug from 'gulp-pug'
import rename from 'gulp-rename'
import gulpSass from 'gulp-sass'
import sassGlob from 'gulp-sass-glob'
import shorthand from 'gulp-shorthand'
import gulpSize from 'gulp-size'
import svg2ttf from 'gulp-svg2ttf'
import ttf2eot from 'gulp-ttf2eot'
import ttf2woff from 'gulp-ttf2woff'
import ttf2woff2 from 'gulp-ttf2woff2'
import webp from 'gulp-webp'
import webpCss from 'gulp-webp-css'
import webpHtml from 'gulp-webp-html'
import imageminMozjpeg from 'imagemin-mozjpeg'
import imageminPngquant from 'imagemin-pngquant'
import imageminSvgo from 'imagemin-svgo'
import path from 'path'
import * as sass from 'sass'
import webpackStream from 'webpack-stream'

const scss = gulpSass(sass)
const isProd = process.env.NODE_ENV === 'production'
const isDev = !isProd
const fontsFolder = './src/fonts/'
const publicFolder = './public/font/'
const scssFile = './src/sass/_fonts.scss'

export const pugToHtml = () => {
	return gulp
		.src('./src/pug/index.pug')
		.pipe(
			gulpPlumber({
				errorHandler: gulpNotify.onError(error => ({
					title: 'PUG',
					message: error.message,
				})),
			})
		)
		.pipe(
			GulpPug({
				pretty: isDev,
				// data: {
				// 	news: require('./data/news.json'),
				// },
			})
		)
		.pipe(webpHtml())
		.pipe(gulp.dest('./public'))
		.pipe(browserSync.stream())
}

export const styleSass = () => {
	return gulp
		.src('./src/sass/main.scss', { sourcemaps: isDev })
		.pipe(
			gulpPlumber({
				errorHandler: gulpNotify.onError(error => ({
					title: 'SCSS',
					message: error.message,
				})),
			})
		)
		.pipe(sassGlob())
		.pipe(scss())
		.pipe(webpCss())
		.pipe(
			autoPrefixer({
				overrideBrowserslist: [
					'> 0.5%',
					'last 3 versions',
					'not dead',
					'not op_mini all',
				],
				cascade: false,
				grid: 'autoplace',
			})
		)
		.pipe(shorthand())
		.pipe(mediaQueries())
		.pipe(gulpSize({ title: 'MAIN.CSS' }))
		.pipe(gulp.dest('./public/css', { sourcemaps: isDev }))
		.pipe(rename({ suffix: '.min' }))
		.pipe(cssO())
		.pipe(gulpSize({ title: 'MAIN.MIN.CSS' }))
		.pipe(gulp.dest('./public/css', { sourcemaps: isDev }))
}

export const javaScript = () => {
	return gulp
		.src('./src/js/main.js', { sourcemaps: isDev })
		.pipe(
			gulpPlumber({
				errorHandler: gulpNotify.onError(error => ({
					title: 'JAVASCRIPT',
					message: error.message,
				})),
			})
		)
		.pipe(babel())
		.pipe(webpackStream({ mode: isProd ? 'production' : 'development' }))
		.pipe(gulp.dest('./public/js', { sourcemaps: isDev }))
}

export const favicon = () => {
	return (
		gulp
			.src('./src/img/favicon/favicon.png', { allowEmpty: true })
			.pipe(
				gulpPlumber({
					errorHandler: gulpNotify.onError(error => ({
						title: 'FAVICON',
						message: error.message,
					})),
				})
			)
			.pipe(
				favicons({
					icons: {
						favicons: true,
						appleIcon: true,
						android: true,
						windows: true, // Включаем поддержку Windows
						yandex: false,
						coast: false,
						firefox: false,
						appleStartup: false,
					},
					path: '/', // Путь для ссылок в meta
					appName: 'My App',
					appShortName: 'App',
					appDescription: 'Best App Ever',
					developerName: 'Your Name',
					developerURL: 'https://yourwebsite.com',
					background: '#fff',
					theme_color: '#000',
					display: 'standalone',
				})
			)
			.on('error', error => console.error('FAVICON ERROR:', error))
			.pipe(gulp.dest('./public/favicons')) // Все файлы сразу в папку

			// Оставляем только нужные файлы в корне public
			.pipe(
				filter([
					'favicon.ico',
					'apple-touch-icon.png',
					'manifest.webmanifest',
					'browserconfig.xml',
				])
			)
			.pipe(gulp.dest('./public'))
	)
}

export const getImage = () => {
	return gulp
		.src('./src/img/*.{png,jpg,jpeg,svg,gif}')
		.pipe(
			gulpPlumber({
				errorHandler: gulpNotify.onError(error => ({
					title: 'IMAGES',
					message: error.message,
				})),
			})
		)
		.pipe(newer('./public/img')) // Проверяем, изменились ли файлы
		.pipe(webp()) // Всегда создаем WebP
		.pipe(gulp.dest('./public/img')) // Сохранение WebP
		.pipe(gulp.src('./src/img/*.{png,jpg,jpeg,svg,gif}'))
		.pipe(newer('./public/img'))
		.pipe(
			gulpIf(
				isProd,
				imagemin([
					imageminMozjpeg({ quality: 80, progressive: true }), // Сжатие JPG
					imageminPngquant({ quality: [0.7, 0.9] }), // Сжатие PNG
					imageminSvgo(), // Оптимизация SVG
				])
			)
		)
		.pipe(gulp.dest('./public/img'))
}

export const getFont = () => {
	return gulp
		.src(`${fontsFolder}*.{eot,ttf,otf,otc,ttc,woff,woff2,svg}`)
		.pipe(
			gulpPlumber({
				errorHandler: gulpNotify.onError(error => ({
					title: 'FONTS',
					message: error.message,
				})),
			})
		)
		.pipe(newer(publicFolder))
		.pipe(gulp.dest(publicFolder))
		.pipe(fonter({ formats: ['ttf'] }))
		.pipe(gulp.dest(fontsFolder))
		.pipe(svg2ttf())
		.pipe(gulp.dest(fontsFolder))
		.pipe(gulp.src(`${fontsFolder}*.ttf`))
		.pipe(ttf2woff())
		.pipe(gulp.dest(publicFolder))
		.pipe(gulp.src(`${fontsFolder}*.ttf`))
		.pipe(ttf2woff2())
		.pipe(gulp.dest(publicFolder))
		.pipe(gulp.src(`${fontsFolder}*.ttf`))
		.pipe(ttf2eot())
		.pipe(gulp.dest(publicFolder))

		.on('end', () => generateFontsScss())
}

export const generateFontsScss = async done => {
	try {
		const files = await fs.promises.readdir(fontsFolder) // Читаем файлы
		const fontFormats = ['.eot', '.woff2', '.woff', '.ttf']
		let fontFaces = ''
		let processedFonts = new Set()

		for (const file of files) {
			const ext = path.extname(file)
			const fontName = path.basename(file, ext)

			if (fontFormats.includes(ext) && !processedFonts.has(fontName)) {
				processedFonts.add(fontName)
				fontFaces += `
@font-face {
  font-family: "${fontName}";
  src: url("../fonts/${fontName}.eot"); /* IE 8 */
  src: url("../fonts/${fontName}.eot?#iefix") format("embedded-opentype"), /* IE 9 */
       url("../fonts/${fontName}.woff2") format("woff2"), /* Современные браузеры */
       url("../fonts/${fontName}.woff") format("woff"), /* Старые браузеры */
       url("../fonts/${fontName}.ttf") format("truetype"); /* Мобильные устройства */
  font-weight: normal;
  font-style: normal;
}
`
			}
		}

		await fs.promises.writeFile(scssFile, fontFaces) // Записываем в _fonts.scss
		console.log('✅ _fonts.scss обновлен!')

		if (done) done() // Завершаем таск в Gulp
	} catch (error) {
		console.error('Ошибка при генерации _fonts.scss:', error)
		if (done) done(error)
	}
}

export const clear = () => {
	return deleteAsync(['./public'], { force: true })
}

export const server = () => {
	browserSync.init({
		server: './public',
		port: 3000, // Явно указываем порт
		notify: false, // Убираем всплывающее уведомление
		ui: { port: 3001 }, // UI для Browsersync
	})
}

export const watch = () => {
	// Следим за Pug и перезагружаем браузер
	gulp
		.watch('./src/pug/**/*.pug', gulp.series(pugToHtml))
		.on('all', browserSync.reload)

	// Следим за SCSS и обновляем CSS без перезагрузки страницы
	gulp
		.watch('./src/sass/**/*.scss', gulp.series(styleSass))
		.on('all', browserSync.reload)

	// Следим за JavaScript
	gulp
		.watch('./src/js/**/*.js', gulp.series(javaScript))
		.on('all', browserSync.reload)

	// Следим за изображениями и шрифтами
	gulp.watch('./src/img/**/*.{jpg,png,jpeg,svg,gif}', gulp.series(getImage))
	gulp.watch(
		'./src/fonts/**/*.{eot,ttf,otf,otc,ttc,woff,woff2,svg}',
		gulp.series(getFont)
	)

	// Следим за favicon
	gulp.watch('./src/img/favicon/favicon.png', gulp.series(favicon))

	// Следим за файлами в public и перезагружаем браузер
	gulp
		.watch(['./public/**/*.html', './public/favicon.ico'])
		.on('all', browserSync.reload)
}

export const build = gulp.series(
	clear, // Удаление папки public перед сборкой
	gulp.parallel(pugToHtml, styleSass, javaScript, getImage, getFont, favicon) // Параллельная обработка
)

export const dev = gulp.series(build, gulp.parallel(server, watch))

export default isProd ? build : dev
