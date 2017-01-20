/*
* 易保利构建风格&tips:
* 生成的文件压缩合并 路径在目标文件的目录！
* md5版本json在目标文件assets/文件夹，生产版本最终引用的是assets/*.json的配置
*/
var gulp = require("gulp");
var webpack = require("webpack");
var sass = require('gulp-sass'); // gulp plugin for sass
var uglify = require('gulp-uglify'); // Minify files with UglifyJS.
var minifyCSS = require('gulp-minify-css'); // 压缩css
var concat = require('gulp-concat'); // Concatenates files
var rename = require('gulp-rename'); // gulp-rename is a gulp plugin to rename files
var cheerio = require('gulp-cheerio'); // 操作页面元素
var concatdir = require('gulp-concat-dir'); // 按目录合并代码
var rev = require('gulp-rev'); // 对文件名加MD5后缀
var revCollector = require('gulp-rev-collector'); // 路径替换
var htmlmin = require('gulp-htmlmin'); // html压缩
var spriter = require('gulp-css-spriter'); // css合成雪碧图

var header = require('gulp-header');
var domSrc = require('gulp-dom-src');

//添加压缩的头信息
var pkg = require('../package.json');
var banner = ['/**',
	'*<%= pkg.name %> - <%= pkg.description %>',
	'* @authors <%= pkg.author %>',
	'* @version <%= pkg.version %>',
	'* @link <%= pkg.homepage %>',
	'* @link <%= pkg.description %>',
	'* @license <%= pkg.license %>',
	'*/',
	''
].join('\n');


(function(){
	var fileUrl = {
		htmlFolder:'../../html/user/user_center.html', //需要构建项目的html目录（相对于gulpfile.js目录
		htmlDir:'../../html/user/', // html文件目录
		jsDir:'../../js/user/', // js文件目录
		cssDir:'../../css/user/', // css文件目录
		cssHref:'../../css/user/', //html引用css的路径,这个路径是html引用css的目录和gulp无关！
		jsSrc:'../../js/user/', //html引用css的路径,这个路径是html引用js的目录和gulp无关！
	};

	var projectName = 'user_center'; // 项目名字，最终html引用的css和js名

	var htmlFolder = fileUrl.htmlFolder;
	var htmlDir = fileUrl.htmlDir;
	var jsDir = fileUrl.jsDir;
	var cssDir = fileUrl.cssDir;
	var cssHref = fileUrl.cssHref;
	var jsSrc = fileUrl.jsSrc;

	/*
	* 读取页面引用js
	* 生成 projectName.ccmin.js
	*/
	gulp.task('domSrcJS',function() {
		return domSrc({file: htmlFolder,  selector: 'script',attribute:'src'})
			.pipe(concat(projectName+'.js'))
			.pipe(uglify())
			.pipe(header(banner,{pkg:pkg}))
			.pipe(rename({suffix:'.ccmin'}))
			.pipe(gulp.dest(jsDir))
	});

	/*
	* 读取页面引用js
	* 生成 projectName.ccmin.css
	*/
	gulp.task('domSrcCSS',function() {
		return domSrc({file: htmlFolder,  selector: 'link',attribute:'href'})
			.pipe(concat(projectName+'.css'))
			.pipe(minifyCSS())
			.pipe(header(banner,{pkg:pkg}))
			.pipe(rename({suffix:'.ccmin'}))
			.pipe(gulp.dest(cssDir))
	});

	/*  css md5
	* 读取目标目录压缩合并的css
	* 生成文件版本号保存至目标assets/目录
	*/
	gulp.task('manifesteCSS',['domSrcCSS'],function() {
		return gulp.src([cssDir+'*.ccmin.css'])
			.pipe(rev())
			.pipe(gulp.dest(cssDir))
			.pipe(rev.manifest())
			.pipe(gulp.dest(cssDir+'assets/'));
	});
	/*  js md5
	* 读取目标目录压缩合并的css
	* 生成文件版本号保存至目标assets/目录
	*/
	gulp.task('manifesteJS',['domSrcJS'],function() {
		return gulp.src([jsDir+'*.ccmin.js'])
			.pipe(rev())
			.pipe(gulp.dest(jsDir))
			.pipe(rev.manifest())
			.pipe(gulp.dest(jsDir+'assets/'));
	})
	/* cheerio
	* 读取目标html，删除全部引用
	* 生成到目标目录 引入的压缩合并的文件
	*/
	gulp.task('domSrcHTML',function() {
		return gulp.src(htmlFolder)
			.pipe(cheerio(function($) {
				$('script').remove();
				$('link').remove();
				$('body').append('<script src="'+jsSrc+projectName+'.ccmin.js"></script>');
				$('head').append('<link rel="stylesheet" href="'+cssHref+projectName+'.ccmin.css">')
			}))
			.pipe(rename({suffix:'.ccmin'}))
			.pipe(gulp.dest(htmlDir));
	});

	/*
	* 修改html的引用
	* html引用带md5版本号的css
	*/
	gulp.task('revColrCSS',['manifesteCSS','domSrcHTML'],function() {
		return gulp.src([cssDir+'assets/*.json',htmlDir+'*.ccmin.html'])
			.pipe(revCollector())
			.pipe(htmlmin({collapseWhitespace: true}))
			.pipe(gulp.dest(htmlDir))
	});

	/*
	* 修改html的引用
	* html引用带md5版本号的js
	*/
	gulp.task('revColrJS',['revColrCSS','manifesteJS'],function() {
		return gulp.src([jsDir+'assets/*.json',htmlDir+'*.ccmin.html'])
			.pipe(revCollector())
			.pipe(htmlmin({collapseWhitespace: true}))
			.pipe(gulp.dest(htmlDir))
	});

	gulp.task('default', ['revColrJS']);
})();






