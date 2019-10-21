const assert = require('assert');
const path = require('path');
const Readable = require('stream').Readable;
const Buffer = require('safe-buffer').Buffer;
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
      assert.strictEqual(file.isNull(), true);
      assert.strictEqual(file.relative, 'empty.js');
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
      assert.strictEqual(err.plugin, pkg.name);
      assert.strictEqual(err.message, 'Streaming not supported');
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
      contents: Buffer.from(input)
    });

    stream.once('data', file => {
      assert.ok(file.isBuffer());
      assert.strictEqual(file.relative, 'default.js');
      assert.strictEqual(file.contents.toString('utf8'), 'var foo = "bar";\n');
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
      contents: Buffer.from(input)
    });

    stream.once('data', file => {
      assert.ok(file.isBuffer());
      assert.strictEqual(file.relative, 'options.js');
      assert.strictEqual(file.contents.toString('utf8'), "var foo = 'bar'\n");
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
      contents: Buffer.from(input)
    });

    stream.on('error', err => {
      assert.ok(err instanceof PluginError);
      assert.strictEqual(err.plugin, pkg.name);
      assert.strictEqual(err.name, 'SyntaxError');
      done();
    });

    stream.write(file);
  });

  it('should adhere to .prettierrc', done => {
    const stream = plugin();

    const input = "var foo = 'bar'";

    const file = new Vinyl({
      cwd: process.cwd(),
      base: path.join(__dirname, 'fixtures'),
      path: path.join(__dirname, 'fixtures', 'config.js'),
      contents: Buffer.from(input)
    });

    stream.once('data', file => {
      assert.ok(file.isBuffer());
      assert.strictEqual(file.relative, 'config.js');
      assert.strictEqual(file.contents.toString('utf8'), "var foo = 'bar'\n");
      done();
    });

    stream.write(file);
  });

  it('should override .prettierrc with plugin options', done => {
    const options = { semi: true };

    const stream = plugin(options);

    const input = "var foo = 'bar'";

    const file = new Vinyl({
      cwd: process.cwd(),
      base: path.join(__dirname, 'fixtures'),
      path: path.join(__dirname, 'fixtures', 'config.js'),
      contents: Buffer.from(input)
    });

    stream.once('data', file => {
      assert.ok(file.isBuffer());
      assert.strictEqual(file.relative, 'config.js');
      assert.strictEqual(file.contents.toString('utf8'), "var foo = 'bar';\n");
      done();
    });

    stream.write(file);
  });

  it('should work with non-js files', done => {
    const stream = plugin();

    const input = 'div{margin:1em}';

    const file = new Vinyl({
      cwd: process.cwd(),
      base: path.join(process.cwd(), 'src'),
      path: path.join(process.cwd(), 'src', 'notjs.css'),
      contents: Buffer.from(input)
    });

    stream.once('data', file => {
      assert.ok(file.isBuffer());
      assert.strictEqual(file.relative, 'notjs.css');
      assert.strictEqual(
        file.contents.toString('utf8'),
        'div {\n  margin: 1em;\n}\n'
      );
      done();
    });

    stream.write(file);
  });

  it('should support editorconfig', done => {
    const options = { editorconfig: true };

    const stream = plugin(options);

    const input = 'function foo() { console.log("bar"); }';

    const file = new Vinyl({
      cwd: process.cwd(),
      base: path.join(__dirname, 'fixtures'),
      path: path.join(__dirname, 'fixtures', 'config.js'),
      contents: Buffer.from(input)
    });

    stream.once('data', file => {
      assert.ok(file.isBuffer());
      assert.strictEqual(file.relative, 'config.js');
      assert.strictEqual(
        file.contents.toString('utf8'),
        "function foo() {\n\tconsole.log('bar')\n}\n"
      );
      done();
    });

    stream.write(file);
  });
});

describe('gulp-prettier.check', () => {
  it('should pass through formatted files', done => {
    const stream = plugin.check();

    const input = 'var foo = "bar";\n';

    const file = new Vinyl({
      cwd: process.cwd(),
      base: path.join(process.cwd(), 'src'),
      path: path.join(process.cwd(), 'src', 'formatted.js'),
      contents: Buffer.from(input)
    });

    stream.once('data', file => {
      assert.ok(file.isBuffer());
      assert.strictEqual(file.relative, 'formatted.js');
      assert.strictEqual(file.contents.toString('utf8'), input);
      done();
    });

    stream.write(file);
  });

  it('should error on unformatted files', done => {
    const stream = plugin.check();

    const input = "var foo = 'bar'";

    const file = new Vinyl({
      cwd: process.cwd(),
      base: path.join(process.cwd(), 'src'),
      path: path.join(process.cwd(), 'src', 'unformatted.js'),
      contents: Buffer.from(input)
    });

    stream.on('error', err => {
      assert.ok(err instanceof PluginError);
      assert.strictEqual(err.plugin, pkg.name);
      assert.ok(err.message.includes('Code style issues found'));
      done();
    });

    stream.end(file);
  });

  it('should list the unformatted files in the error message', done => {
    const stream = plugin.check();

    const unformattedInput = "var foo = 'bar'";
    const formattedInput = 'var foo = "bar";\n';

    const fileA = new Vinyl({
      cwd: process.cwd(),
      base: path.join(process.cwd(), 'src'),
      path: path.join(process.cwd(), 'src', 'a.js'),
      contents: Buffer.from(unformattedInput)
    });

    const fileB = new Vinyl({
      cwd: process.cwd(),
      base: path.join(process.cwd(), 'src'),
      path: path.join(process.cwd(), 'src', 'b.js'),
      contents: Buffer.from(formattedInput)
    });

    const fileC = new Vinyl({
      cwd: process.cwd(),
      base: path.join(process.cwd(), 'src'),
      path: path.join(process.cwd(), 'src', 'c.js'),
      contents: Buffer.from(unformattedInput)
    });

    stream.on('error', err => {
      assert.ok(err.message.includes('src/a.js'));
      assert.ok(err.message.includes('src/c.js'));
      assert.ok(!err.message.includes('src/b.js'));
      done();
    });

    stream.write(fileA);
    stream.write(fileB);
    stream.end(fileC);
  });
});
