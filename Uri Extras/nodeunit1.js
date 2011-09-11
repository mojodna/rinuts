var
    fs = require('fs'),
    path = require('path');

// TODO: remove this when https://github.com/joyent/node/pull/1312
//       lands in core.
//
// Until then, use console.log from npm (https://gist.github.com/1077544)
require('../deps/console.log');

//require.paths.push(process.cwd());
var args = process.ARGV.slice(2);

var files = [];

var testrunner,
    config_file,
    config_param_found = false,
    output_param_found = false,
    reporter_file = 'default',
    reporter_param_found = false,
    testspec_param_found = false;

var usage = "Usage: nodeunit [options] testmodule1.js testfolder [...] \n" +
            "Options:\n\n" +
            "  --config FILE     the path to a JSON file with options\n" +
            "  --reporter cFILE   optional path to a reporter file to customize the output\n" +
            "  --list-reporters  list available build-in reporters\n" +
            "  -t name,          specify a test to run\n" +
            "  -h, --help        display this help and exit\n" +
            "  -v, --version     output version information and exit";


// load default options
var content = fs.readFileSync(__dirname + '/nodeunit.json', 'utf8');
var options = JSON.parse(content);

// a very basic pseudo --options parser
args.forEach(function (arg) {
    if (arg.slice(0, 9) === "--config=") {
        config_file = arg.slice(9);
    } else if (arg === '--config') {
        config_param_found = true;
    } else if (config_param_found) {
        config_file = arg;
        config_param_found = false;
    } else if (arg.slice(0, 9) === "--output=") {
        options.output = arg.slice(9);
    } else if (arg === '--output') {
        output_param_found = true;
    } else if (output_param_found) {
        options.output = arg;
        output_param_found = false;
    } else if (arg.slice(0, 11) === "--reporter=") {
        reporter_file = arg.slice(11);
    } else if (arg === '--reporter') {
        reporter_param_found = true;
    } else if (reporter_param_found) {
        reporter_file = arg;
        reporter_param_found = false;
    } else if (arg === '-t') {
        testspec_param_found = true;
    } else if (testspec_param_found) {
        options.testspec = arg;
        testspec_param_found = false;
    } else if (arg === '--list-reporters') {
        var reporters = fs.readdirSync(__dirname + '/../lib/reporters');
        reporters = reporters.filter(function (reporter_file) {
            return (/\.js$/).test(reporter_file);
        }).map(function (reporter_file) {
            return reporter_file.replace(/\.js$/, '');
        }).filter(function (reporter_file) {
            return reporter_file !== 'index';
        });
        console.log('Build-in reporters: ');
        reporters.forEach(function (reporter_file) {
            var reporter = require('../lib/reporters/' + reporter_file);
            console.log('  * ' + reporter_file + (reporter.info ? ': ' + reporter.info : ''));
        });
        process.exit(0);
    } else if ((arg === '-v') || (arg === '--version')) {
        var content = fs.readFileSync(__dirname + '/../package.json', 'utf8');
        var pkg = JSON.parse(content);
        console.log(pkg.version);
        process.exit(0);
    } else if ((arg === '-h') || (arg === '--help')) {
        console.log(usage);
        process.exit(0);
    } else {
        files.push(arg);
    }
});

if (files.length === 0) {
    console.log('Files required.');
    console.log(usage);
    process.exit(1);
}

if (config_file) {
    content = fs.readFileSync(config_file, 'utf8');
    var custom_options = JSON.parse(content);

    for (var option in custom_options) {
        if (typeof option === 'string') {
            options[option] = custom_options[option];
        }
    }
}

var builtin_reporters = require(__dirname + '/../lib/reporters');
if (reporter_file in builtin_reporters) {
    testrunner = builtin_reporters[reporter_file];
}
else {
    testrunner = require(reporter_file);
}
testrunner.run(files, options);
