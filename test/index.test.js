import path from 'node:path';
import {Readable} from 'node:stream';
import assert from 'node:assert/strict';
import test from 'node:test';
import PluginError from 'plugin-error';
import prettier from '../index.js';
import {createFile} from './_helper.js';

test('passes through file when file isNull()', async () => {
	const stream = prettier();

	stream.end(createFile({
		path: 'src/empty.js',
		contents: null,
	}));

	const [file] = await stream.toArray();

	assert.ok(file.isNull());
});

test('emits an error when file isStream()', async () => {
	const stream = prettier();

	stream.end(createFile({
		path: 'src/stream.js',
		contents: Readable.from('var foo = bar'),
	}));

	await assert.rejects(stream.toArray(), error => {
		assert.ok(error instanceof PluginError);
		assert.equal(error.plugin, 'gulp-prettier');
		assert.equal(error.message, 'Streaming not supported');

		return true;
	});
});

test('formats a file with Prettier', async () => {
	const stream = prettier();

	stream.end(createFile({
		path: 'src/default.js',
		contents: 'var foo = \'bar\'',
	}));

	const [file] = await stream.toArray();

	assert.equal(file.contents.toString(), 'var foo = "bar";\n');
});

test('passes options to Prettier', async () => {
	const stream = prettier({singleQuote: true, semi: false});

	stream.end(createFile({
		path: 'src/options.js',
		contents: 'var foo = \'bar\'',
	}));

	const [file] = await stream.toArray();

	assert.equal(file.contents.toString(), 'var foo = \'bar\'\n');
});

test('emits an error when Prettier errors', async () => {
	const stream = prettier();

	stream.end(createFile({
		path: 'src/error.js',
		contents: 'var foo = \'bar"',
	}));

	await assert.rejects(stream.toArray(), error => {
		assert.ok(error instanceof PluginError);
		assert.equal(error.plugin, 'gulp-prettier');
		assert.equal(error.name, 'SyntaxError');
		assert.equal(error.fileName, 'src/error.js');

		return true;
	});
});

test('adheres to .prettierrc', async () => {
	const stream = prettier();

	stream.end(createFile({
		path: path.join(import.meta.dirname, 'fixtures', 'config.js'),
		contents: 'var foo = \'bar\'',
	}));

	const [file] = await stream.toArray();

	assert.equal(file.contents.toString(), 'var foo = \'bar\'\n');
});

test('overrides .prettierrc with plugin options', async () => {
	const stream = prettier({semi: true});

	stream.end(createFile({
		path: path.join(import.meta.dirname, 'fixtures/config.js'),
		contents: 'var foo = \'bar\'',
	}));

	const [file] = await stream.toArray();

	assert.equal(file.contents.toString(), 'var foo = \'bar\';\n');
});

test('works with non-js files', async () => {
	const stream = prettier();

	stream.end(createFile({
		path: 'src/notjs.css',
		contents: 'div{margin:1em}',
	}));

	const [file] = await stream.toArray();

	assert.equal(file.contents.toString(), 'div {\n  margin: 1em;\n}\n');
});

test('supports editorconfig', async () => {
	const stream = prettier({editorconfig: true});

	stream.end(createFile({
		path: path.join(import.meta.dirname, 'fixtures/config.js'),
		contents: 'function foo() { console.log("bar"); }',
	}));

	const [file] = await stream.toArray();

	assert.equal(file.contents.toString(), 'function foo() {\n\tconsole.log(\'bar\')\n}\n');
});

test('check() passes through formatted files', async () => {
	const stream = prettier.check();
	const input = 'var foo = "bar";\n';

	stream.end(createFile({
		path: 'src/formatted.js',
		contents: input,
	}));

	const [file] = await stream.toArray();

	assert.equal(file.contents.toString(), input);
});

test('check() errors on unformatted files', async () => {
	const stream = prettier.check();

	stream.end(createFile({
		path: 'src/unformatted.js',
		contents: 'var foo = \'bar\'',
	}));

	await assert.rejects(stream.toArray(), error => {
		assert.ok(error instanceof PluginError);
		assert.equal(error.plugin, 'gulp-prettier');
		assert.ok(error.message.includes('Code style issues found'));

		return true;
	});
});

test('check() lists the unformatted files in the error message', async () => {
	const stream = prettier.check();

	const unformattedInput = 'var foo = \'bar\'';
	const formattedInput = 'var foo = "bar";\n';

	stream.write(createFile({
		path: 'src/a.js',
		contents: unformattedInput,
	}));

	stream.write(createFile({
		path: 'src/b.js',
		contents: formattedInput,
	}));

	stream.end(createFile({
		path: 'src/c.js',
		contents: unformattedInput,
	}));

	await assert.rejects(stream.toArray(), error => {
		assert.ok(error.message.includes('src/a.js'));
		assert.ok(error.message.includes('src/c.js'));
		assert.ok(!error.message.includes('src/b.js'));

		return true;
	});
});
