'use strict';
const Buffer = require('safe-buffer').Buffer;
const through = require('through2');
const PluginError = require('plugin-error');
const prettier = require('prettier');

const PLUGIN_NAME = 'gulp-prettier';

module.exports = function(options) {
  options = options || {};

  return through.obj(function(file, encoding, callback) {
    if (file.isNull()) {
      return callback(null, file);
    }

    if (file.isStream()) {
      return callback(new PluginError(PLUGIN_NAME, 'Streaming not supported'));
    }

    const config = prettier.resolveConfig.sync(file.path);
    const fileOptions = Object.assign({}, config, options, {
      filepath: file.path
    });

    const unformattedCode = file.contents.toString('utf8');

    try {
      const formattedCode = prettier.format(unformattedCode, fileOptions);

      if (formattedCode !== unformattedCode) {
        file.isPrettier = true;
        file.contents = Buffer.from(formattedCode);
      }

      this.push(file);
    } catch (error) {
      this.emit('error', new PluginError(PLUGIN_NAME, error));
    }

    callback();
  });
};
