const test = require('ava');
const path = require('path');
const { Readable } = require('stream');
const PluginError = require('plugin-error');
const Vinyl = require('vinyl');

const pkg = require('../package.json');
const plugin = require('..');

test.cb('passes through file when file isNull()', (t) => {
  const stream = plugin();

  const file = new Vinyl({
    cwd: process.cwd(),
    base: path.join(process.cwd(), 'src'),
    path: path.join(process.cwd(), 'src', 'empty.js'),
    contents: null,
  });

  stream.on('data', (file) => {
    t.true(file.isNull());
    t.is(file.relative, 'empty.js');
    t.end();
  });

  stream.write(file);
});

test.cb('emits an error when file isStream()', (t) => {
  const stream = plugin();

  const input = new Readable();
  input.push('var foo = bar');
  input.push(null);

  const file = new Vinyl({
    cwd: process.cwd(),
    base: path.join(process.cwd(), 'src'),
    path: path.join(process.cwd(), 'src', 'stream.js'),
    contents: input,
  });

  stream.on('error', (err) => {
    t.true(err instanceof PluginError);
    t.is(err.plugin, pkg.name);
    t.is(err.message, 'Streaming not supported');
    t.end();
  });

  stream.write(file);
});

test.cb('formats a file with Prettier', (t) => {
  const stream = plugin();

  const input = "var foo = 'bar'";

  const file = new Vinyl({
    cwd: process.cwd(),
    base: path.join(process.cwd(), 'src'),
    path: path.join(process.cwd(), 'src', 'default.js'),
    contents: Buffer.from(input),
  });

  stream.once('data', (file) => {
    t.true(file.isBuffer());
    t.is(file.relative, 'default.js');
    t.is(file.contents.toString('utf8'), 'var foo = "bar";\n');
    t.end();
  });

  stream.write(file);
});

test.cb('passes options to Prettier', (t) => {
  const options = { singleQuote: true, semi: false };

  const stream = plugin(options);

  const input = "var foo = 'bar'";

  const file = new Vinyl({
    cwd: process.cwd(),
    base: path.join(process.cwd(), 'src'),
    path: path.join(process.cwd(), 'src', 'options.js'),
    contents: Buffer.from(input),
  });

  stream.once('data', (file) => {
    t.true(file.isBuffer());
    t.is(file.relative, 'options.js');
    t.is(file.contents.toString('utf8'), "var foo = 'bar'\n");
    t.end();
  });

  stream.write(file);
});

test.cb('emits an error when Prettier errors', (t) => {
  const stream = plugin();

  const input = 'var foo = \'bar"';

  const file = new Vinyl({
    cwd: process.cwd(),
    base: path.join(process.cwd(), 'src'),
    path: path.join(process.cwd(), 'src', 'error.js'),
    contents: Buffer.from(input),
  });

  stream.on('error', (err) => {
    t.true(err instanceof PluginError);
    t.is(err.plugin, pkg.name);
    t.is(err.name, 'SyntaxError');
    t.is(err.fileName, path.join(process.cwd(), 'src', 'error.js'));
    t.end();
  });

  stream.write(file);
});

test.cb('adheres to .prettierrc', (t) => {
  const stream = plugin();

  const input = "var foo = 'bar'";

  const file = new Vinyl({
    cwd: process.cwd(),
    base: path.join(__dirname, 'fixtures'),
    path: path.join(__dirname, 'fixtures', 'config.js'),
    contents: Buffer.from(input),
  });

  stream.once('data', (file) => {
    t.true(file.isBuffer());
    t.is(file.relative, 'config.js');
    t.is(file.contents.toString('utf8'), "var foo = 'bar'\n");
    t.end();
  });

  stream.write(file);
});

test.cb('overrides .prettierrc with plugin options', (t) => {
  const options = { semi: true };

  const stream = plugin(options);

  const input = "var foo = 'bar'";

  const file = new Vinyl({
    cwd: process.cwd(),
    base: path.join(__dirname, 'fixtures'),
    path: path.join(__dirname, 'fixtures', 'config.js'),
    contents: Buffer.from(input),
  });

  stream.once('data', (file) => {
    t.true(file.isBuffer());
    t.is(file.relative, 'config.js');
    t.is(file.contents.toString('utf8'), "var foo = 'bar';\n");
    t.end();
  });

  stream.write(file);
});

test.cb('works with non-js files', (t) => {
  const stream = plugin();

  const input = 'div{margin:1em}';

  const file = new Vinyl({
    cwd: process.cwd(),
    base: path.join(process.cwd(), 'src'),
    path: path.join(process.cwd(), 'src', 'notjs.css'),
    contents: Buffer.from(input),
  });

  stream.once('data', (file) => {
    t.true(file.isBuffer());
    t.is(file.relative, 'notjs.css');
    t.is(file.contents.toString('utf8'), 'div {\n  margin: 1em;\n}\n');
    t.end();
  });

  stream.write(file);
});

test.cb('supports editorconfig', (t) => {
  const options = { editorconfig: true };

  const stream = plugin(options);

  const input = 'function foo() { console.log("bar"); }';

  const file = new Vinyl({
    cwd: process.cwd(),
    base: path.join(__dirname, 'fixtures'),
    path: path.join(__dirname, 'fixtures', 'config.js'),
    contents: Buffer.from(input),
  });

  stream.once('data', (file) => {
    t.true(file.isBuffer());
    t.is(file.relative, 'config.js');
    t.is(
      file.contents.toString('utf8'),
      "function foo() {\n\tconsole.log('bar')\n}\n"
    );
    t.end();
  });

  stream.write(file);
});

test.cb('check() passes through formatted files', (t) => {
  const stream = plugin.check();

  const input = 'var foo = "bar";\n';

  const file = new Vinyl({
    cwd: process.cwd(),
    base: path.join(process.cwd(), 'src'),
    path: path.join(process.cwd(), 'src', 'formatted.js'),
    contents: Buffer.from(input),
  });

  stream.once('data', (file) => {
    t.true(file.isBuffer());
    t.is(file.relative, 'formatted.js');
    t.is(file.contents.toString('utf8'), input);
    t.end();
  });

  stream.write(file);
});

test.cb('check() errors on unformatted files', (t) => {
  const stream = plugin.check();

  const input = "var foo = 'bar'";

  const file = new Vinyl({
    cwd: process.cwd(),
    base: path.join(process.cwd(), 'src'),
    path: path.join(process.cwd(), 'src', 'unformatted.js'),
    contents: Buffer.from(input),
  });

  stream.on('error', (err) => {
    t.true(err instanceof PluginError);
    t.is(err.plugin, pkg.name);
    t.true(err.message.includes('Code style issues found'));
    t.end();
  });

  stream.end(file);
});

test.cb('check() lists the unformatted files in the error message', (t) => {
  const stream = plugin.check();

  const unformattedInput = "var foo = 'bar'";
  const formattedInput = 'var foo = "bar";\n';

  const fileA = new Vinyl({
    cwd: process.cwd(),
    base: path.join(process.cwd(), 'src'),
    path: path.join(process.cwd(), 'src', 'a.js'),
    contents: Buffer.from(unformattedInput),
  });

  const fileB = new Vinyl({
    cwd: process.cwd(),
    base: path.join(process.cwd(), 'src'),
    path: path.join(process.cwd(), 'src', 'b.js'),
    contents: Buffer.from(formattedInput),
  });

  const fileC = new Vinyl({
    cwd: process.cwd(),
    base: path.join(process.cwd(), 'src'),
    path: path.join(process.cwd(), 'src', 'c.js'),
    contents: Buffer.from(unformattedInput),
  });

  stream.on('error', (err) => {
    t.true(err.message.includes('src/a.js'));
    t.true(err.message.includes('src/c.js'));
    t.true(!err.message.includes('src/b.js'));
    t.end();
  });

  stream.write(fileA);
  stream.write(fileB);
  stream.end(fileC);
});
