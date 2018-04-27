'use strict';
const Buffer = require('safe-buffer').Buffer;
const through = require('through2');
const PluginError = require('plugin-error');
const prettier = require('prettier');
const applySourceMap = require('vinyl-sourcemaps-apply');

const pkg = require('./package.json');

module.exports = function(options) {
  options = options || {};

  function transform(file, encoding, callback) {
    if (file.isNull()) return callback(null, file);
    if (file.isStream())
      return callback(new PluginError(pkg.name, 'Streaming not supported'));

    options.filepath = file.path;

    const str = file.contents.toString('utf8');

    prettier
      .resolveConfig(file.path)
      .then(config => {
        const finalOptions = Object.assign({}, config, options);
        const data = prettier.format(str, finalOptions);

        if (data && data.v3SourceMap && file.sourceMap) {
          applySourceMap(file, data.v3SourceMap);
          if (file.contents.toString() !== data.js) file.isPrettier = true;
          file.contents = Buffer.from(data.js);
        } else {
          if (file.contents.toString() !== data) file.isPrettier = true;
          file.contents = Buffer.from(data);
        }

        callback(null, file);
      })
      .catch(err => callback(new PluginError(pkg.name, err)));
  }

  return through.obj(transform);
};
