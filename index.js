const through = require("through2");
const gutil = require("gulp-util");
const prettier = require("prettier");
const applySourceMap = require("vinyl-sourcemaps-apply");
const _ = require("lodash");

var PluginError = gutil.PluginError;

module.exports = function(opt) {
  function transform(file, encoding, callback) {
    if (file.isNull()) return callback(null, file);
    if (file.isStream())
      return callback(
        new PluginError("gulp-nf-prettier", "Streaming not supported")
      );

    let data;
    let str = file.contents.toString("utf8");

    const prettierOptions = _.omit(opt, "check");

    try {
      data = prettier.format(str, prettierOptions);
    } catch (err) {
      return callback(new PluginError("gulp-nf-prettier", err));
    }

    if (opt.check) {
      if (data !== str) {
        return callback(
          new PluginError(
            "gulp-nf-prettier",
            `${file.path} was not formatted with prettier`
          )
        );
      } else {
        return callback(null, file);
      }
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
