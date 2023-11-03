import path from 'node:path';
import {Transform} from 'node:stream';
import {Buffer} from 'node:buffer';
import process from 'node:process';
import PluginError from 'plugin-error';
import prettier from 'prettier';

export default function plugin(options = {}) {
	return new Transform({
		objectMode: true,
		async transform(file, encoding, callback) {
			if (file.isNull()) {
				return callback(null, file);
			}

			if (file.isStream()) {
				return callback(new PluginError('gulp-prettier', 'Streaming not supported'));
			}

			const config = await prettier.resolveConfig(file.path, options);
			const fileOptions = {...config, ...options, filepath: file.path};

			const unformattedCode = file.contents.toString('utf8');

			try {
				const formattedCode = await prettier.format(unformattedCode, fileOptions);

				if (formattedCode !== unformattedCode) {
					file.isPrettier = true;
					file.contents = Buffer.from(formattedCode);
				}

				this.push(file);
			} catch (error) {
				this.emit(
					'error',
					new PluginError('gulp-prettier', error, {fileName: file.path}),
				);
			}

			callback();
		},
	});
}

plugin.check = function (options = {}) {
	const unformattedFiles = [];

	return new Transform({
		objectMode: true,
		async transform(file, encoding, callback) {
			if (file.isNull()) {
				return callback(null, file);
			}

			if (file.isStream()) {
				return callback(
					new PluginError('gulp-prettier', 'Streaming not supported'),
				);
			}

			const config = await prettier.resolveConfig(file.path, options);
			const fileOptions = {...config, ...options, filepath: file.path};

			const unformattedCode = file.contents.toString('utf8');

			try {
				const isFormatted = await prettier.check(unformattedCode, fileOptions);

				if (!isFormatted) {
					const filename = path
						.relative(process.cwd(), file.path)
						.replaceAll('\\', '/');
					unformattedFiles.push(filename);
				}

				this.push(file);
			} catch (error) {
				this.emit(
					'error',
					new PluginError('gulp-prettier', error, {fileName: file.path}),
				);
			}

			callback();
		},
		flush(callback) {
			if (unformattedFiles.length > 0) {
				const header
          = 'Code style issues found in the following file(s). Forgot to run Prettier?';
				const body = unformattedFiles.join('\n');

				const message = `${header}\n${body}`;

				this.emit('error', new PluginError('gulp-prettier', message));
			}

			callback();
		},
	});
};
