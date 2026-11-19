import {Buffer} from 'node:buffer';
import Vinyl from 'vinyl';

export function createFile({
	path,
	contents = '',
}) {
	return new Vinyl({
		path,
		contents: typeof contents === 'string' ? Buffer.from(contents, 'utf8') : contents,
	});
}
