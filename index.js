'use strict';
const through = require('through2');
const PluginError = require('plugin-error');
const prettier = require('prettier');
const applySourceMap = require('vinyl-sourcemaps-apply');

const pkg = require('./package.json');

module.exports = function(options) {
  function transform(file, encoding, callback) {
    if (file.isNull()) return callback(null, file);
    if (file.isStream())
      return callback(new PluginError(pkg.name, 'Streaming not supported'));

    let data;
    const str = file.contents.toString('utf8');

    try {
      data = prettier.format(str, options);
    } catch (err) {
      return callback(new PluginError(pkg.name, err));
    }

    if (data && data.v3SourceMap && file.sourceMap) {
      applySourceMap(file, data.v3SourceMap);
      if (file.contents.toString() !== data.js) file.isPrettier = true;
      file.contents = new Buffer(data.js);
    } else {
      if (file.contents.toString() !== data) file.isPrettier = true;
      file.contents = new Buffer(data);
    }

    callback(null, file);
  }

  return through.obj(transform);
};
