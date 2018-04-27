# Gulp Prettier [![Build Status](https://travis-ci.org/bhargavrpatel/gulp-prettier.svg?branch=master)](https://travis-ci.org/bhargavrpatel/gulp-prettier)

A [Gulp](http://gulpjs.com/) plugin which allows the users to use [Prettier](https://github.com/jlongster/prettier).

> Prettier is an opinionated JavaScript formatter inspired by refmt with advanced support for language features from ES2017, JSX, and Flow. It removes all original styling and ensures that all outputted JavaScript conforms to a consistent style. (See this blog post)

> _NOTE_: To ensure this plugin continues to serve its usefulness, I've added @TheDancingCode as the active collaborator. He will be the active maintainer - BRP (April 26, 2018)

## Usage

Simply pipe the input, and pass in arguments that you would to the regular format function.

```js
const gulp = require('gulp');
const prettier = require('gulp-prettier');

gulp.task('default', () => {
  return gulp.src('*.js')
    .pipe(prettier({ singleQuote: true }))
    .pipe(gulp.dest('./dist'));
});
```

## API

### prettier([options])

#### options

Type: `Object`

Consult the Prettier [options](https://prettier.io/docs/en/options.html).

## Collaborators

I'd like to take this oppertunity to thank all of the contributors to this project:

\- @akella
\- @trusktr
\- @TheDancingCode

## License

[MIT License](https://raw.githubusercontent.com/bhargavrpatel/gulp-prettier/master/LICENSE)
