const through = require('through2'),
  gutil = require('gulp-util'),
  prettier = require('prettier'),
  merge = require('merge'),
  applySourceMap = require('vinyl-sourcemaps-apply');

var PluginError = gutil.PluginError;

module.exports = function(opt) {
  function transform(file, encoding, callback) {
    if (file.isNull())
      return callback(null, file);
    if (file.isStream())
      return callback(new PluginError(
        'gulp-prettier',
        'Streaming not supported'
      ));

    let data;
    let str = file.contents.toString('utf8');

    options = merge(
      {        
        // Fit code within this line limit
        printWidth: 80,
        // Number of spaces it should use per tab
        tabWidth: 2,
        // Use tabs instead of spaces
        useTabs: false,
        // Remove semicolons
        semi: false,
        // If true, will use single instead of double quotes
        singleQuote: true,
        // Controls the printing of trailing commas wherever possible
        trailingComma: "all",
        // Controls the printing of spaces inside array and objects
        bracketSpacing: true,
        // Put JSX angle brackets on a new line rather than the last line of attributes
        jsxBracketSameLine: false,
      },
      opt
    );

    try {
      data = prettier.format(str, options);
    } catch (err) {
      console.log('there was a fucking error b!!');
      return callback(new PluginError('gulp-prettier', err));
    }

    if (data && data.v3SourceMap && file.sourceMap) {
      applySourceMap(file, data.v3SourceMap);
      file.contents = new Buffer(data.js);
    } else {
      file.contents = new Buffer(data);
    }

    callback(null, file);
  }

  return through.obj(transform);
};
