const test = require('ava');
const path = require('path');
const { Readable } = require('stream');
const pEvent = require('p-event');
const PluginError = require('plugin-error');
const Vinyl = require('vinyl');

const pkg = require('../package.json');
const plugin = require('..');

test('passes through file when file isNull()', async t => {
  const stream = plugin();
  const data = pEvent(stream, 'data');

  const file = new Vinyl({
    cwd: process.cwd(),
    base: path.join(process.cwd(), 'src'),
    path: path.join(process.cwd(), 'src', 'empty.js'),
    contents: null,
  });

  stream.end(file);

  const output = await data;
  t.true(output.isNull());
  t.is(output.relative, 'empty.js');
});

test('emits an error when file isStream()', async t => {
  const stream = plugin();
  const data = pEvent(stream, 'error');

  const input = new Readable();
  input.push('var foo = bar');
  input.push(null);

  const file = new Vinyl({
    cwd: process.cwd(),
    base: path.join(process.cwd(), 'src'),
    path: path.join(process.cwd(), 'src', 'stream.js'),
    contents: input,
  });

  stream.end(file);

  const output = await data;
  t.true(output instanceof PluginError);
  t.is(output.plugin, pkg.name);
  t.is(output.message, 'Streaming not supported');
});

test('formats a file with Prettier', async t => {
  const stream = plugin();
  const data = pEvent(stream, 'data');

  const input = "var foo = 'bar'";

  const file = new Vinyl({
    cwd: process.cwd(),
    base: path.join(process.cwd(), 'src'),
    path: path.join(process.cwd(), 'src', 'default.js'),
    contents: Buffer.from(input),
  });

  stream.end(file);

  const output = await data;
  t.true(output.isBuffer());
  t.is(output.relative, 'default.js');
  t.is(output.contents.toString('utf8'), 'var foo = "bar";\n');
});

test('passes options to Prettier', async t => {
  const options = { singleQuote: true, semi: false };

  const stream = plugin(options);
  const data = pEvent(stream, 'data');

  const input = "var foo = 'bar'";

  const file = new Vinyl({
    cwd: process.cwd(),
    base: path.join(process.cwd(), 'src'),
    path: path.join(process.cwd(), 'src', 'options.js'),
    contents: Buffer.from(input),
  });
  
  stream.end(file);
  
  const output = await data;
  t.true(output.isBuffer());
  t.is(output.relative, 'options.js');
  t.is(output.contents.toString('utf8'), "var foo = 'bar'\n");
});

test('emits an error when Prettier errors', async t => {
  const stream = plugin();
  const data = pEvent(stream, 'error');

  const input = 'var foo = \'bar"';

  const file = new Vinyl({
    cwd: process.cwd(),
    base: path.join(process.cwd(), 'src'),
    path: path.join(process.cwd(), 'src', 'error.js'),
    contents: Buffer.from(input),
  });
  
  stream.end(file);
  
  const output = await data;
  t.true(output instanceof PluginError);
  t.is(output.plugin, pkg.name);
  t.is(output.name, 'SyntaxError');
  t.is(output.fileName, path.join(process.cwd(), 'src', 'error.js'));
});

test('adheres to .prettierrc', async t => {
  const stream = plugin();
  const data = pEvent(stream, 'data');

  const input = "var foo = 'bar'";

  const file = new Vinyl({
    cwd: process.cwd(),
    base: path.join(__dirname, 'fixtures'),
    path: path.join(__dirname, 'fixtures', 'config.js'),
    contents: Buffer.from(input),
  });
  
  stream.end(file);
  
  const output = await data;
  t.true(output.isBuffer());
  t.is(output.relative, 'config.js');
  t.is(output.contents.toString('utf8'), "var foo = 'bar'\n");
});

test('overrides .prettierrc with plugin options', async t => {
  const options = { semi: true };

  const stream = plugin(options);
  const data = pEvent(stream, 'data');

  const input = "var foo = 'bar'";

  const file = new Vinyl({
    cwd: process.cwd(),
    base: path.join(__dirname, 'fixtures'),
    path: path.join(__dirname, 'fixtures', 'config.js'),
    contents: Buffer.from(input),
  });
  
  stream.end(file);
  const output = await data;
  t.true(output.isBuffer());
  t.is(output.relative, 'config.js');
  t.is(output.contents.toString('utf8'), "var foo = 'bar';\n");
});

test('works with non-js files', async t => {
  const stream = plugin();
  const data = pEvent(stream, 'data');

  const input = 'div{margin:1em}';

  const file = new Vinyl({
    cwd: process.cwd(),
    base: path.join(process.cwd(), 'src'),
    path: path.join(process.cwd(), 'src', 'notjs.css'),
    contents: Buffer.from(input),
  });
  
  stream.end(file);
  
  const output = await data;
  t.true(output.isBuffer());
  t.is(output.relative, 'notjs.css');
  t.is(output.contents.toString('utf8'), 'div {\n  margin: 1em;\n}\n');
});

test('supports editorconfig', async t => {
  const options = { editorconfig: true };

  const stream = plugin(options);
  const data = pEvent(stream, 'data');

  const input = 'function foo() { console.log("bar"); }';

  const file = new Vinyl({
    cwd: process.cwd(),
    base: path.join(__dirname, 'fixtures'),
    path: path.join(__dirname, 'fixtures', 'config.js'),
    contents: Buffer.from(input),
  });
  
  stream.end(file);
  
  const output = await data;
  t.true(output.isBuffer());
  t.is(output.relative, 'config.js');
  t.is(
    output.contents.toString('utf8'),
    "function foo() {\n\tconsole.log('bar')\n}\n"
  );
});

test('check() passes through formatted files', async t => {
  const stream = plugin.check();
  const data = pEvent(stream, 'data');

  const input = 'var foo = "bar";\n';

  const file = new Vinyl({
    cwd: process.cwd(),
    base: path.join(process.cwd(), 'src'),
    path: path.join(process.cwd(), 'src', 'formatted.js'),
    contents: Buffer.from(input),
  });
  
  stream.end(file);
  
  const output = await data;
  t.true(output.isBuffer());
  t.is(output.relative, 'formatted.js');
  t.is(output.contents.toString('utf8'), input);

});

test('check() errors on unformatted files', async t => {
  const stream = plugin.check();
  const data = pEvent(stream, 'error');

  const input = "var foo = 'bar'";

  const file = new Vinyl({
    cwd: process.cwd(),
    base: path.join(process.cwd(), 'src'),
    path: path.join(process.cwd(), 'src', 'unformatted.js'),
    contents: Buffer.from(input),
  });
  
  stream.end(file);
  
  const output = await data;
  t.true(output instanceof PluginError);
  t.is(output.plugin, pkg.name);
  t.true(output.message.includes('Code style issues found'));
});

test('check() lists the unformatted files in the error message', async t => {
  const stream = plugin.check();
  const data = pEvent(stream, 'error');

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
  
  stream.write(fileA);
  stream.write(fileB);
  stream.end(fileC);
  
  const output = await data;
  t.true(output.message.includes('src/a.js'));
  t.true(output.message.includes('src/c.js'));
  t.true(!output.message.includes('src/b.js'));
});
