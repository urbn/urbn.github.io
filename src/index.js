const serve = require('metalsmith-serve'),
    cmdArgs = require('yargs').argv;

let builder = require('./builder/builder');

if (cmdArgs.serve) {
    builder = builder.use(serve({
        port: 8080,
        verbose: true,
    }));
}

builder.build((err) => {
    /* eslint-disable no-console */
    if (err) {
        console.error(err);
    } else {
        console.log('Site build complete!');
    }
    /* eslint-enable no-console */
});
