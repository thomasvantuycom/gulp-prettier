'use strict';
const path = require('path');
const through = require('through2');
const PluginError = require('plugin-error');
const prettier = require('prettier');

const PLUGIN_NAME = 'gulp-prettier';

module.exports = function (options) {
  options = options || {};

  return through.obj(function (file, encoding, callback) {
    if (file.isNull()) {
      return callback(null, file);
    }

    if (file.isStream()) {
      return callback(new PluginError(PLUGIN_NAME, 'Streaming not supported'));
    }

    const config = prettier.resolveConfig.sync(file.path, options);
    const fileOptions = { ...config, ...options, filepath: file.path };

    const unformattedCode = file.contents.toString('utf8');

    try {
      const formattedCode = prettier.format(unformattedCode, fileOptions);

      if (formattedCode !== unformattedCode) {
        file.isPrettier = true;
        file.contents = Buffer.from(formattedCode);
      }

      this.push(file);
    } catch (error) {
      this.emit(
        'error',
        new PluginError(PLUGIN_NAME, error, { fileName: file.path })
      );
    }

    callback();
  });
};

module.exports.check = function (options) {
  options = options || {};

  const unformattedFiles = [];

  return through.obj(
    function (file, encoding, callback) {
      if (file.isNull()) {
        return callback(null, file);
      }

      if (file.isStream()) {
        return callback(
          new PluginError(PLUGIN_NAME, 'Streaming not supported')
        );
      }

      const config = prettier.resolveConfig.sync(file.path, options);
      const fileOptions = { ...config, ...options, filepath: file.path };

      const unformattedCode = file.contents.toString('utf8');

      try {
        const isFormatted = prettier.check(unformattedCode, fileOptions);

        if (!isFormatted) {
          const filename = path
            .relative(process.cwd(), file.path)
            .replace(/\\/g, '/');
          unformattedFiles.push(filename);
        }

        this.push(file);
      } catch (error) {
        this.emit(
          'error',
          new PluginError(PLUGIN_NAME, error, { fileName: file.path })
        );
      }

      callback();
    },
    function (callback) {
      if (unformattedFiles.length > 0) {
        const header =
          'Code style issues found in the following file(s). Forgot to run Prettier?';
        const body = unformattedFiles.join('\n');

        const message = `${header}\n${body}`;

        this.emit('error', new PluginError(PLUGIN_NAME, message));
      }

      callback();
    }
  );
};
