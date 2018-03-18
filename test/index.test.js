const assert = require('assert');
const path = require('path');
const Readable = require('stream').Readable;
const PluginError = require('plugin-error');
const Vinyl = require('vinyl');

const pkg = require('../package.json');
const plugin = require('..');

describe('gulp-prettier', () => {
  it('should pass through file when file isNull()', done => {
    const stream = plugin();

    const file = new Vinyl({
      cwd: process.cwd(),
      base: path.join(process.cwd(), 'src'),
      path: path.join(process.cwd(), 'src', 'empty.js'),
      contents: null
    });

    stream.on('data', file => {
      assert.equal(file.isNull(), true);
      assert.equal(file.relative, 'empty.js');
      done();
    });

    stream.write(file);
  });

  it('should emit an error when file isStream()', done => {
    const stream = plugin();

    const input = new Readable();
    input.push('var foor = bar');
    input.push(null);

    const file = new Vinyl({
      cwd: process.cwd(),
      base: path.join(process.cwd(), 'src'),
      path: path.join(process.cwd(), 'src', 'stream.js'),
      contents: input
    });

    stream.on('error', err => {
      assert.ok(err instanceof PluginError);
      assert.equal(err.plugin, pkg.name);
      assert.equal(err.message, 'Streaming not supported');
      done();
    });

    stream.write(file);
  });

  it('should format a file with Prettier', done => {
    const stream = plugin();

    const input = "var foo = 'bar'";

    const file = new Vinyl({
      cwd: process.cwd(),
      base: path.join(process.cwd(), 'src'),
      path: path.join(process.cwd(), 'src', 'default.js'),
      contents: new Buffer(input)
    });

    stream.once('data', file => {
      assert.ok(file.isBuffer());
      assert.equal(file.relative, 'default.js');
      assert.equal(file.contents.toString('utf8'), 'var foo = "bar";\n');
      done();
    });

    stream.write(file);
  });

  it('should pass options to Prettier', done => {
    const options = { singleQuote: true, semi: false };

    const stream = plugin(options);

    const input = "var foo = 'bar'";

    const file = new Vinyl({
      cwd: process.cwd(),
      base: path.join(process.cwd(), 'src'),
      path: path.join(process.cwd(), 'src', 'options.js'),
      contents: new Buffer(input)
    });

    stream.once('data', file => {
      assert.ok(file.isBuffer());
      assert.equal(file.relative, 'options.js');
      assert.equal(file.contents.toString('utf8'), "var foo = 'bar'\n");
      done();
    });

    stream.write(file);
  });

  it('should emit an error when Prettier errors', done => {
    const stream = plugin();

    const input = 'var foo = \'bar"';

    const file = new Vinyl({
      cwd: process.cwd(),
      base: path.join(process.cwd(), 'src'),
      path: path.join(process.cwd(), 'src', 'error.js'),
      contents: new Buffer(input)
    });

    stream.on('error', err => {
      assert.ok(err instanceof PluginError);
      assert.equal(err.plugin, pkg.name);
      assert.equal(err.name, 'SyntaxError');
      done();
    });

    stream.write(file);
  });
});
