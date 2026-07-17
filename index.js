import path from 'node:path';
import {Transform} from 'node:stream';
import {Buffer} from 'node:buffer';
import process from 'node:process';
import PluginError from 'plugin-error';
import prettier from 'prettier';

export default function plugin(options = {}) {
	return new Transform({
		objectMode: true,

		async transform(file, _, callback) {
			if (file.isNull()) {
				callback(null, file);

				return;
			}

			if (file.isStream()) {
				callback(new PluginError('gulp-prettier', 'Streaming not supported'));

				return;
			}

			try {
				const config = await prettier.resolveConfig(file.path, options);
				const fileOptions = {...config, ...options, filepath: file.path};

				const unformattedCode = file.contents.toString('utf8');
				const formattedCode = await prettier.format(unformattedCode, fileOptions);

				if (formattedCode !== unformattedCode) {
					file.isPrettier = true;
					file.contents = Buffer.from(formattedCode);
				}

				callback(null, file);
			} catch (error) {
				callback(new PluginError('gulp-prettier', error, {fileName: file.path}));
			}
		},
	});
}

plugin.check = function (options = {}) {
	return new Transform({
		objectMode: true,

		construct(callback) {
			this.unformattedFiles = [];

			callback();
		},

		async transform(file, _, callback) {
			if (file.isNull()) {
				callback(null, file);

				return;
			}

			if (file.isStream()) {
				callback(new PluginError('gulp-prettier', 'Streaming not supported'));

				return;
			}

			try {
				const config = await prettier.resolveConfig(file.path, options);
				const fileOptions = {...config, ...options, filepath: file.path};

				const unformattedCode = file.contents.toString('utf8');
				const isFormatted = await prettier.check(unformattedCode, fileOptions);

				if (!isFormatted) {
					const filename = path
						.relative(process.cwd(), file.path)
						.replaceAll('\\', '/');
					this.unformattedFiles.push(filename);
				}

				callback(null, file);
			} catch (error) {
				callback(new PluginError('gulp-prettier', error, {fileName: file.path}));
			}
		},

		flush(callback) {
			if (this.unformattedFiles.length > 0) {
				const header
					= 'Code style issues found in the following file(s). Forgot to run Prettier?';
				const body = this.unformattedFiles.join('\n');

				const message = `${header}\n${body}`;

				callback(new PluginError('gulp-prettier', message));

				return;
			}

			callback();
		},
	});
};
