# gulp-prettier 

> Format files with [Prettier](https://github.com/prettier/prettier)

[![GitHub Workflow Status](https://github.com/TheDancingCode/gulp-prettier/actions/workflows/ci.yml/badge.svg)](https://github.com/thomasvantuycom/gulp-prettier/actions/workflows/ci.yml) [![npm version](https://img.shields.io/npm/v/gulp-prettier.svg)](https://www.npmjs.com/package/gulp-prettier) [![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/semantic-release/semantic-release)

## Install

```
npm install gulp-prettier --save-dev
```

## Usage

```js
import gulp from 'gulp';
import prettier from 'gulp-prettier';

function format() {
  return gulp.src('src/*.js')
    .pipe(prettier({ singleQuote: true }))
    .pipe(gulp.dest('dist'));
}

export default format;
```

To check whether or not your files adhere to Prettier's formatting, use `prettier.check`. This can be used as a validation step in CI scenarios.

```js
import gulp from 'gulp';
import prettier from 'gulp-prettier';

function validate() {
  return gulp.src('dist/*.js')
    .pipe(prettier.check({ singleQuote: true }));
}

export default validate;
```

## API

### prettier([options])

Formats your files using Prettier.

#### options

Type: `Object`

Consult the Prettier [options](https://prettier.io/docs/en/options.html).

`editorconfig: true` can also be passed to enable [EditorConfig support](https://prettier.io/docs/en/api.html#prettierresolveconfigfilepath--options).

### prettier.check([options])

Checks if your files have been formatted with Prettier and, if not, throws an error with a list of unformatted files. This is useful for running Prettier in CI scenarios.

#### options

Type: `Object`

Consult the Prettier [options](https://prettier.io/docs/en/options.html).

`editorconfig: true` can also be passed to enable [EditorConfig support](https://prettier.io/docs/en/api.html#prettierresolveconfigfilepath--options).

## License

MIT © [Thomas Vantuycom](https://github.com/thomasvantuycom)
