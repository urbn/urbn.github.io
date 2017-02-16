const metalsmith = require('metalsmith'),
    assets = require('metalsmith-assets'),
    pageTitles = require('metalsmith-page-titles'),
    favicons = require('metalsmith-favicons'),
    drafts = require('metalsmith-drafts'),
    collections = require('metalsmith-collections'),
    tags = require('metalsmith-tags'),
    pagination = require('metalsmith-pagination'),
    markdown = require('metalsmith-markdown'),
    metallic = require('metalsmith-metallic'),
    typography = require('metalsmith-typography'),
    permalinks = require('metalsmith-permalinks'),
    layouts = require('metalsmith-layouts'),
    sass = require('metalsmith-sass'),
    autoprefixer = require('metalsmith-autoprefixer'),
    icons = require('metalsmith-icons'),
    ignore = require('metalsmith-ignore'),
    nunjucks = require('nunjucks'),
    cmdArgs = require('yargs').argv,
    moment = require('moment'),
    _ = require('lodash'),

    // Metalsmith plugins
    excerpts = require('./plugins/metalsmith/excerpts'),
    readtime = require('./plugins/metalsmith/readtime'),
    metadataPatch = require('./plugins/metalsmith/metadata-patch'),

    // Nunjucks filters
    nunjucksJsonFilter = require('./plugins/nunjucks/json-filter'),
    nunjucksMdFilter = require('./plugins/nunjucks/markdown-filter'),

    // Global configuration data
    metadataOpts = {
        site: {
            url: 'http://urbn.engineering',
            title: 'URBN Engineering',
            prod: cmdArgs.prod === true,
        },
        moment,
        _,
    };

module.exports =
    metalsmith(__dirname)
        .metadata(metadataOpts)
        // Generate page titles
        .use(pageTitles())
        // Read all input from contents/
        .source('../contents')
        // Write all output to output/
        .destination('../../output')
        // Workaround for metalsmith.metadata issue on watching files
        // See: https://github.com/segmentio/metalsmith-collections/issues/27#issuecomment-266647074
        .use(metadataPatch(metadataOpts))
        // Clean the output directory each time
        .clean(true)
        // Copy static assets from assets/ -> assets/
        .use(assets({
            source: '../assets',
            destination: 'assets',
        }))
        // Generate favicon from source image
        .use(favicons({
            src: 'assets/images/urbn.png',
            dest: 'favicon/',
            icons: {
                android: true,
                appleIcon: true,
                favicons: true,
            },
        }))
        // Allow draft:true front-matter flags
        .use(drafts())
        // Generate post readtimes
        .use(readtime({
            path: 'post/**/*.md',
        }))
        // Add code highlighting to markdown files
        .use(metallic())
        // Process markdown files
        .use(markdown())
        // Run files through typography plugin for formatting
        .use(typography({
            lang: 'en',
        }))
        // Generate post excerpts
        .use(excerpts())
        // Define a posts collection of all posts, to be rendered to /post/title
        .use(collections({
            posts: {
                pattern: 'post/**.html',
                sortBy: 'date',
                reverse: true,
            },
        }))
        // Paginate posts collection
        .use(pagination({
            'collections.posts': {
                layout: 'posts.nunjucks',
                perPage: 6,
                first: 'posts/index.html',
                noPageOne: true,
                path: 'posts/page/:num/index.html',
            },
        }))
        // Generate tag pages
        .use(tags({
            handle: 'tags',
            path: 'tags/:tag.html',
            pathPage: 'tags/:tag/:num/index.html',
            perPage: 6,
            layout: 'tag.nunjucks',
            sortBy: 'date',
            reverse: true,
        }))
        // Generate permalinks
        //   contents/post/test-post -> /post/test-post/index.html
        .use(permalinks({
            relative: false,
        }))
        // Register the rendering engine
        .use(layouts({
            engine: 'nunjucks',
            directory: '../templates',
            // Function add nunjucks specific functionality
            exposeConsolidate(requires) {
                _.set(requires, 'nunjucks', nunjucks.configure());
                nunjucksMdFilter.install(requires.nunjucks);
                nunjucksJsonFilter.install(requires.nunjucks);
            },
        }))
        // Use the Fontello icons plugin to scrape for used fonts and generate
        // a font icon file
        .use(icons({
            sets: {
                fa: 'fontawesome',
            },
            fontello: {
                name: 'icons',
                css_prefix_text: 'fa-',
            },
            CSSDir: 'css',
            fontDir: 'css/fonts',
        }))
        // Compile scss files from contents/
        .use(sass({
            outputStyle: cmdArgs.prod ? 'compressed' : 'expanded',
            sourceMap: !cmdArgs.prod,
            sourceMapContents: !cmdArgs.prod,
            sourceMapEmbed: !cmdArgs.prod,
        }))
        // Autoprefix CSS
        .use(autoprefixer())
        // Don't output .json files
        .use(ignore('**/*.json'));
